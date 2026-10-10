import cloudinary from '../config/cloudinary.js';

export const uploadAnswerAudio = async (filePath, sessionId) => {
    return cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        folder: `mock-interviewer/${sessionId}/answers`,
        type: 'authenticated'
    });
};

export const deleteAnswerAudio = async (publicId) => {
    if (!publicId) return;

    const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
        type: 'authenticated',
        invalidate: true
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }

    return result;
};