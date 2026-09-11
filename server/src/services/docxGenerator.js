// =========================================================================
// MVP TESTING CHECKLIST
// Before deploying, test these 6 scenarios to ensure Word handles the 
// layout gracefully (Word handles pagination natively, but we must test edge cases):
// 1. Normal: 5 questions, short answers, short feedback.
// 2. Long Answer: One answer is 1000+ words (tests Word's native text wrapping).
// 3. Abandoned Interview: Some answered, some unanswered, isPartialEvaluation = true.
// 4. Empty Arrays: strengths = [], weaknesses = [], recommendations = [].
// 5. Long Question: Question text spans several lines.
// 6. Many Questions: 10–20 questions (tests multi-page flow in Word).
// =========================================================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from "docx";

export async function generateDOCX(data) {
  // We build a declarative tree of document elements. 
  // Packer.toBuffer() will serialize this tree into a valid .docx file (which is just a ZIP of XML files).
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // ==========================================
          // SECTION 1: HEADER & META INFORMATION
          // ==========================================
          
          // Main Title
          new Paragraph({
            text: "AI Mock Interview Evaluation Report",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }, // Adds space below the title (in twips, 1/20 of a point)
          }),

          // Robust Two-Column Layout using a Borderless Table.
          // This guarantees the left and right columns stay perfectly aligned, 
          // even if we add/remove lines later. No magic coordinates or tabs needed.
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  // --- Left Column ---
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: `UserId: ${data.userId}`, size: 22, color: "4B5563" })] }),
                      new Paragraph({ children: [new TextRun({ text: `SessionId: ${data.sessionId}`, size: 22, color: "4B5563" })] }),
                      new Paragraph({ children: [new TextRun({ text: `Role: ${data.role}`, size: 22, color: "4B5563" })] }),
                      new Paragraph({ children: [new TextRun({ text: `Interview Type: ${data.interviewType}`, size: 22, color: "4B5563" })] }),
                      new Paragraph({ children: [new TextRun({ text: `Difficulty: ${data.difficulty}`, size: 22, color: "4B5563" })] }),
                      new Paragraph({ children: [new TextRun({ text: `Status: ${data.status}`, size: 22, color: "4B5563" })] }),
                    ],
                  }),
                  // --- Right Column ---
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: `Date: ${data.date}`, size: 22, color: "4B5563" })] }),
                      new Paragraph({ children: [new TextRun({ text: `Experience: ${data.experience} years`, size: 22, color: "4B5563" })] }),
                      new Paragraph({ 
                        children: [new TextRun({ 
                          text: `Focus Skills: ${Array.isArray(data.skills) ? data.skills.join(", ") : data.skills}`, 
                          size: 22, color: "4B5563" 
                        })] 
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "" }), // Spacer

          // ==========================================
          // SECTION 2: SCORES
          // ==========================================
          
          new Paragraph({
            text: "Performance Scores",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          // Overall Score (Large, centered, color-coded)
          // Note: DOCX font size is in "half-points". So size: 80 = 40pt font.
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${data.overallScore}/100`,
                size: 80, 
                bold: true,
                color: getScoreColorHex(data.overallScore),
              }),
            ],
          }),

          // Domain and Communication Scores (Side-by-side using spaced TextRuns)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Domain Knowledge: `, size: 24, color: "374151" }),
              new TextRun({ text: `${data.domainScore}/100`, size: 24, bold: true, color: "111827" }),
              new TextRun({ text: "    |    ", size: 24, color: "D1D5DB" }), // Visual separator
              new TextRun({ text: `Communication: `, size: 24, color: "374151" }),
              new TextRun({ text: `${data.communicationScore}/100`, size: 24, bold: true, color: "111827" }),
            ],
          }),

          new Paragraph({ text: "" }), // Spacer

          // ==========================================
          // SECTION 3: EVALUATION SUMMARY
          // ==========================================
          
          // FIX #1: Changed from invalid `if` statement to conditional spread operator
          // JavaScript does not allow `if` statements directly inside array literals.
          // The spread operator `...` with a ternary condition is the correct pattern.
          ...(data.isPartialEvaluation
            ? [
                new Paragraph({
                  shading: { fill: "FEE2E2", type: ShadingType.CLEAR }, // Light red background
                  spacing: { before: 200, after: 400 },
                  children: [
                    new TextRun({
                      text: "WARNING: This is a partial evaluation. Some questions were not assessed.",
                      bold: true,
                      color: "991B1B", // Dark red text
                      size: 20,
                    }),
                  ],
                }),
              ]
            : []),

          // General Feedback
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: data.feedback || "No general feedback provided.",
                size: 22,
                color: "374151",
              }),
            ],
          }),

          // Strengths
          new Paragraph({ text: "Strengths:", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }),
          ...(data.strengths && data.strengths.length > 0
            ? data.strengths.map((strength) =>
                new Paragraph({
                  bullet: { level: 0 }, // Native Word bullet point
                  children: [new TextRun({ text: strength, size: 22, color: "111827" })],
                })
              )
            : [
                // FIX #2: Moved text into TextRun, removed from Paragraph
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: "None identified",
                      size: 22,
                      color: "6B7280",
                    }),
                  ],
                }),
              ]),

          new Paragraph({ text: "" }), // Spacer

          // Weaknesses
          new Paragraph({ text: "Areas for Improvement:", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }),
          ...(data.weaknesses && data.weaknesses.length > 0
            ? data.weaknesses.map((weakness) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [new TextRun({ text: weakness, size: 22, color: "111827" })],
                })
              )
            : [
                // FIX #2: Moved text into TextRun, removed from Paragraph
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: "None identified",
                      size: 22,
                      color: "6B7280",
                    }),
                  ],
                }),
              ]),

          new Paragraph({ text: "" }), // Spacer

          // Recommendations
          new Paragraph({ text: "Recommendations:", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }),
          ...(data.recommendations && data.recommendations.length > 0
            ? data.recommendations.map((rec) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [new TextRun({ text: rec, size: 22, color: "111827" })],
                })
              )
            : [
                // FIX #2: Moved text into TextRun, removed from Paragraph
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: "No specific recommendations",
                      size: 22,
                      color: "6B7280",
                    }),
                  ],
                }),
              ]),

          new Paragraph({ text: "" }), // Spacer

          // ==========================================
          // SECTION 4: QUESTION & ANSWER BREAKDOWN
          // ==========================================
          
          new Paragraph({
            text: "Question-by-Question Breakdown",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 300 },
          }),

          // Loop through every question. 
          // Word's document model handles page flow naturally. Long answers will wrap 
          // and continue onto the next page without any manual Y-coordinate checks.
          ...data.questionsAndAnswers.flatMap((qa) => [
            // The Question
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({ 
                  text: `Q${qa.questionNumber}: ${qa.question}`, 
                  bold: true, 
                  size: 24, 
                  color: "1F2937" 
                }),
              ],
            }),
            
            // The "Candidate's Answer:" label
            new Paragraph({
              spacing: { after: 50 },
              children: [
                new TextRun({ 
                  text: "Candidate's Answer: ", 
                  italics: true, 
                  size: 22, 
                  color: "4B5563" 
                }),
              ],
            }),

            // The Actual Answer (Word will automatically wrap long text to the next line/page)
            new Paragraph({
              spacing: { after: 300 }, // Generous space before the next question
              indent: { left: 400 }, // Indent the answer to visually separate it from the label
              children: [
                new TextRun({ 
                  text: qa.answer, 
                  size: 22, 
                  color: "111827" 
                }),
              ],
            }),
          ]),

          // ==========================================
          // SECTION 5: DOCUMENT ENDING
          // ==========================================
          
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ 
                text: `Evaluation Model: ${data.modelUsed || "Unknown"}`, 
                size: 18, 
                color: "9CA3AF",
                italics: true,
              }),
            ],
          }),

          ...(data.completedAt
            ? [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ 
                      text: `Completed At: ${data.completedAt}`, 
                      size: 18, 
                      color: "9CA3AF",
                      italics: true,
                    }),
                  ],
                }),
              ]
            : []),
        ],
      },
    ],
  });

  // Serialize the declarative document tree into a binary Buffer
  return await Packer.toBuffer(doc);
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Returns a hex color code based on the overall score.
// NOTE: The 'docx' library expects hex codes WITHOUT the '#' prefix.
function getScoreColorHex(score) {
  if (score >= 80) return "059669"; // Emerald Green (Excellent)
  if (score >= 60) return "D97706"; // Amber/Orange (Average)
  return "DC2626";                  // Red (Needs Improvement)
}