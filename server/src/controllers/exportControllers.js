import Result from "../models/Result.js";
import { generateDOCX } from "../services/docxGenerator.js";
import { generatePDF } from "../services/pdfGenerator.js";
import { transformData } from "../utils/dataTransformation.js";


const MIME_TYPES = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};


export async function downloadInterviewResult(req, res) {

    try {

        const { sessionId } = req.params;

        const { format = 'pdf' } = req.query;

        // 1. Validate format
        if (!MIME_TYPES[format]) {
            return res.status(400).json({ error: 'Invalid format. Use pdf or docx.' });
        }

        // 2. Fetch result + verify ownership
        const result = await Result.findOne({ session: sessionId }).populate({
            path: 'session',
            populate: {
                path: 'user'
            }
        });
        if(!result){
            return res.status(404).json({ message: "Result not found" });
        }

        if(!result.session){
            return res.status(404).json({ message:"Session not found" });
        }

        if (result.session.user._id.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized" })
        }



        // 3. Transform data
        const documentData = transformData(result);

        // 4. Generate file
        const buffer = format === 'pdf'
            ? await generatePDF(documentData)
            : await generateDOCX(documentData);

        // 5. Send with correct headers
        const filename = `interview-results-${result.session.role.replace(/\s+/g, '-')}-${sessionId}.` + format;

        res.setHeader('Content-Type', MIME_TYPES[format]);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (err) {
        console.error('Download failed:', err);
        res.status(500).json({ error: 'Failed to generate document' });
    }
}