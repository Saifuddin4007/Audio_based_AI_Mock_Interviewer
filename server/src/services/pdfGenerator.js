// 1. IMPORT THE LIBRARY
import PDFDocument from 'pdfkit';

// =========================================================================
// MVP TESTING CHECKLIST (Suggestion #9)
// Before deploying, test these 6 scenarios to ensure pagination and 
// edge cases don't break the PDF layout:
// 1. Normal: 5 questions, short answers, short feedback.
// 2. Long Answer: One answer is 1000+ words (tests text wrapping).
// 3. Abandoned Interview: Some answered, some unanswered, isPartialEvaluation = true.
// 4. Empty Arrays: strengths = [], weaknesses = [], recommendations = [].
// 5. Long Question: Question text spans several lines.
// 6. Many Questions: 10–20 questions (tests multi-page pagination).
// =========================================================================

export async function generatePDF(data) {
  return new Promise((resolve, reject) => {
    
    // 4. INITIALIZE THE PDF DOCUMENT
    const doc = new PDFDocument({ 
      size: 'A4', 
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      // FIX #2: Removed `bufferPages: true`. 
      // It consumes extra memory and is only needed if you plan to add 
      // "Page X of Y" footers later. For now, keep it lean.
    });

    // 5. SET UP THE STREAM LISTENERS
    const chunks = []; 
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ==========================================
    // SECTION 1: HEADER & META INFORMATION
    // ==========================================
    
    doc
      .fontSize(22)
      .fillColor('#111827') 
      .font('Helvetica-Bold') 
      .text('AI Mock Interview Evaluation Report', { align: 'center' });
    
    doc.moveDown(1); 

    doc
      .fontSize(11)
      .font('Helvetica') 
      .fillColor('#4B5563'); 

    // FIX #6: Robust Two-Column Layout
    // Instead of using a magic number like `doc.y - 45`, we record the 
    // starting Y position. This prevents layout breakage if we add/remove 
    // lines of metadata in the future.
    const rightColumnX = 320;
    const metaStartY = doc.y;

    // --- Left Column ---
    doc.text(`UserId: ${data.userId}`);
    doc.text(`SessionId: ${data.sessionId}`);
    doc.text(`Role: ${data.role}`);
    doc.text(`Interview Type: ${data.interviewType}`);
    doc.text(`Difficulty: ${data.difficulty}`);
    doc.text(`Status: ${data.status}`);
    
    const leftColumnEndY = doc.y; // Remember where the left column ended

    // --- Right Column ---
    // We explicitly pass (x, y) coordinates to anchor these to the top of the meta section
    doc.text(`Date: ${data.date}`, rightColumnX, metaStartY);
    doc.text(`Experience: ${data.experience} years`, rightColumnX, metaStartY + 15);
    doc.text(
      `Focus Skills: ${Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}`, 
      rightColumnX, 
      metaStartY + 30
    );

    // Move the cursor to the bottom of whichever column is taller
    doc.y = Math.max(leftColumnEndY, metaStartY + 45);

    doc.moveDown(0.5); 
    drawDivider(doc); 


    // ==========================================
    // SECTION 2: SCORES
    // ==========================================
    
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text('Performance Scores', { underline: true });
    
    doc.moveDown(0.5);

    // FIX #3: Corrected syntax bug. 
    // Changed { align: 'align: center' } to { align: 'center' }
    doc
      .fontSize(40)
      .fillColor(getScoreColor(data.overallScore)) 
      .font('Helvetica-Bold')
      .text(`${data.overallScore}/100`, { align: 'center' }); 
    
    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .fillColor('#374151')
      .font('Helvetica');
    
    doc.text(`Domain Knowledge: `, { continued: true }); 
    doc.font('Helvetica-Bold').text(`${data.domainScore}/100`, { continued: true });
    
    doc.x = rightColumnX; 
    doc.font('Helvetica').text(`Communication: `, { continued: true });
    doc.font('Helvetica-Bold').text(`${data.communicationScore}/100`);

    doc.moveDown(1);
    drawDivider(doc);


    // ==========================================
    // SECTION 3: EVALUATION SUMMARY
    // ==========================================
    
    // FIX #4: Simplified condition. 
    // `isPartialEvaluation` is the authoritative source of truth. 
    // Checking `status !== 'Completed'` was fragile due to case-sensitivity 
    // ('completed' vs 'Completed') and business logic edge cases.
    if (data.isPartialEvaluation) {
      
      // FIX #5: Robust Warning Box Positioning
      // Instead of relying on doc.y shifting during drawing, we lock the 
      // starting Y coordinate, draw the box, and place the text precisely.
      const boxY = doc.y;
      const boxHeight = 30;
      
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#991B1B') // Dark red
        .rect(50, boxY, 495, boxHeight) // Draw rectangle
        .fillAndStroke('#FEE2E2', '#991B1B'); // Fill light red, border dark red
      
      // FIX #8: Replaced '⚠' with 'WARNING:' 
      // Built-in Helvetica has limited Unicode support. Emojis/symbols 
      // can render as blank squares or cause crashes in some environments.
      doc
        .fillColor('#991B1B')
        .text(
          'WARNING: This is a partial evaluation. Some questions were not assessed.', 
          55, 
          boxY + 8, // Position text neatly inside the box
          { width: 480, align: 'center' }
        );
      
      // Manually advance the cursor below the warning box
      doc.y = boxY + boxHeight + 15; 
    }

    // General Feedback
    doc
      .fontSize(14)
      .fillColor('#111827')
      .font('Helvetica-Bold')
      .text('Overall Feedback');
    
    doc.moveDown(0.3);
    doc
      .fontSize(11)
      .fillColor('#374151')
      .font('Helvetica')
      .text(data.feedback || 'No general feedback provided.'); 

    doc.moveDown(0.8);

    // Strengths
    doc.font('Helvetica-Bold').fontSize(12).text('Strengths:');
    doc.moveDown(0.2);
    if (data.strengths && data.strengths.length > 0) {
      data.strengths.forEach((strength) => {
        doc.font('Helvetica').fontSize(11).text(`• ${strength}`, { indent: 15 });
      });
    } else {
      doc.font('Helvetica').fontSize(11).text('• None identified', { indent: 15 });
    }

    doc.moveDown(0.5);

    // Weaknesses
    doc.font('Helvetica-Bold').fontSize(12).text('Areas for Improvement:');
    doc.moveDown(0.2);
    if (data.weaknesses && data.weaknesses.length > 0) {
      data.weaknesses.forEach((weakness) => {
        doc.font('Helvetica').fontSize(11).text(`• ${weakness}`, { indent: 15 });
      });
    } else {
      doc.font('Helvetica').fontSize(11).text('• None identified', { indent: 15 });
    }

    doc.moveDown(0.5);

    // Recommendations
    doc.font('Helvetica-Bold').fontSize(12).text('Recommendations:');
    doc.moveDown(0.2);
    if (data.recommendations && data.recommendations.length > 0) {
      data.recommendations.forEach((rec) => {
        doc.font('Helvetica').fontSize(11).text(`• ${rec}`, { indent: 15 });
      });
    } else {
      doc.font('Helvetica').fontSize(11).text('• No specific recommendations', { indent: 15 });
    }

    doc.moveDown(1);
    drawDivider(doc);


    // ==========================================
    // SECTION 4: QUESTION & ANSWER BREAKDOWN
    // ==========================================
    
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text('Question-by-Question Breakdown');
    
    doc.moveDown(0.5);

    data.questionsAndAnswers.forEach((qa, index) => {
      
      // FIX #1: More Conservative Pagination Check
      // Changed from 650 to 680. An A4 page is ~842 points tall. 
      // Leaving a 162-point buffer (842 - 680) ensures that if a candidate's 
      // answer is unusually long, it has room to wrap to the next page 
      // naturally without cutting off awkwardly or overlapping the margin.
      if (doc.y > 680) {
        doc.addPage();
        // Re-draw a mini header on new pages for context
        doc.fontSize(10).fillColor('#9CA3AF').text(`AI Interview Report - ${data.role}`, 50, 30);
        drawDivider(doc);
        doc.moveDown(1);
      }

      // 1. Draw the Question
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1F2937')
        .text(`Q${qa.questionNumber}: ${qa.question}`);
      
      doc.moveDown(0.3);

      // 2. Draw the Answer
      doc
        .fontSize(11)
        .font('Helvetica-Oblique') 
        .fillColor('#4B5563')
        .text(`Candidate's Answer:`, { indent: 10 });
      
      doc.moveDown(0.2);
      doc
        .font('Helvetica') 
        .fillColor('#111827')
        .text(qa.answer, { indent: 20 }); 
      
      doc.moveDown(0.8); 
    });


    // ==========================================
    // SECTION 5: DOCUMENT ENDING
    // ==========================================
    // FIX #7: Renamed from "FOOTER" to "DOCUMENT ENDING". 
    // A true PDF footer repeats at the bottom of *every* page. 
    // This is just concluding information for the end of the document.
    
    drawDivider(doc);
    
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .fillColor('#9CA3AF') 
      .font('Helvetica')
      .text(`Evaluation Model: ${data.modelUsed || 'Unknown'}`, { align: 'left' });
    
    if (data.completedAt) {
      doc.text(`Completed At: ${data.completedAt}`, { align: 'right' });
    }

    // 6. FINALIZE THE DOCUMENT
    doc.end();
  });
}


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function drawDivider(doc) {
  const y = doc.y + 5; 
  
  doc
    .moveTo(50, y)          
    .lineTo(545, y)         
    .strokeColor('#E5E7EB') 
    .lineWidth(1)           
    .stroke();              
  
  doc.y = y + 10; 
}

function getScoreColor(score) {
  if (score >= 80) return '#059669'; 
  if (score >= 60) return '#D97706'; 
  return '#DC2626';                  
}