module.exports = (req, res, next) => {
    if (!req.files || !req.files.media) return next(); // Skip if no file
    
    const file = req.files.media;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    
    if (!validTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: 'Invalid file type. Only images (JPEG, PNG, GIF) and MP4 videos are allowed'
      });
    }
  
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return res.status(400).json({
        message: 'File size too large. Maximum 50MB allowed'
      });
    }
  
    next();
  };  