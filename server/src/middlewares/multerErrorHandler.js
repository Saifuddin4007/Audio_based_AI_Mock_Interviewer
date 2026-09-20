import multer from 'multer';

export const errorHandler= (err, req, res, next)=>{
    if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File is too large. Maximum size is 10MB." });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message }); // Catches our fileFilter error
  }
  // If there is no error, pass to the next middleware
  next();
}