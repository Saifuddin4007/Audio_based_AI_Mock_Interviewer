import multer from 'multer';

const fileFilter= (req, file, cb)=>{
    const allowedTypes= [
        'audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg'
    ];

    if(allowedTypes.includes(file.mimetype)){
        cb(null, true);
    }else{
        cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
};




export const upload= multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {fileSize: 10 * 1024 * 1024}
});