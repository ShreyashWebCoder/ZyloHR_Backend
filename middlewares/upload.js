const multer = require("multer");
const path = require("path");

// Allowed file extensions (images/videos)
const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv/;

// Multer storage config
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}_${Date.now()}${ext}`);
  },
});

// File type filter
const fileFilter = (req, file, cb) => {
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed!"), false);
  }
};

// Multer upload instance (5MB for image, 100MB for video)
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // max 100 MB (covers most cases)
  },
  fileFilter,
});

module.exports = upload;
