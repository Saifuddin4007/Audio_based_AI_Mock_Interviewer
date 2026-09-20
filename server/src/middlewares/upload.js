import multer from 'multer';
import path from 'path';

const storage= multer.diskStorage({

    destination: (req, file, cb)=>{
        cb(null, 'uploads/');
    },

    filename: (req, file, cb)=>{
        const unique= `${Date.now()}-${Math.round(Math.random()*1E9)}`;
        const ext= path.extname(file.originalname);
        cb(null, `audio-${unique}${ext}`);
    }


});

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
    storage,
    fileFilter,
    limits: {fileSize: 10 * 1024 * 1024}
});