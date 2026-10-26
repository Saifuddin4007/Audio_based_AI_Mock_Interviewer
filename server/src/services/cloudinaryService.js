import cloudinary from '../config/cloudinary.js';


export const uploadAnswerAudio = (fileBuffer, sessionId) => {
    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'video',
                folder: `mock-interviewer/${sessionId}/answers`,
                type: 'authenticated'
            },

            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(fileBuffer);
    });
};



export const deleteAnswerAudio = async (publicId) => {
    if (!publicId) return;

    const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
        type: 'authenticated',
        invalidate: true
    });

    if (
        result.result !== 'ok' &&
        result.result !== 'not found'
    ) {
        throw new Error(
            `Cloudinary deletion failed: ${result.result}`
        );
    }

    return result;
};