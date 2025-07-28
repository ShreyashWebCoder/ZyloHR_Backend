// // server/routes/verify.js
// const express = require("express");
// const multer = require("multer");
// const axios = require("axios");
// const fs = require("fs");
// const path = require("path");
// const FormData = require("form-data");
// const router = express.Router();
// const upload = multer({ dest: "uploads/" });

// router.post("/face-verification", upload.single("image"), async (req, res) => {
//   const form = new FormData();
//   form.append("file", fs.createReadStream(req.file.path));

//   try {
//     const response = await axios.post(
//       "http://127.0.0.1:5000/verify", 
//       form,
//       {
//         headers: form.getHeaders(),
//       }
//     );
//     if (!response.data || !response.data.name) {
//       return res.status(400).json({ error: "Face not recognized" });
//     }
//     res.json(response.data);
//   } catch (error) {
//     console.error("Face verification failed:", error.message);
//     res.status(500).json({ error: "Verification failed" });
//   } finally {
//     fs.unlinkSync(req.file.path); // Clean up uploaded file
//   }
// });



// // Configure multer for file uploads
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, 'uploads/');
// //   },
// //   filename: (req, file, cb) => {
// //     cb(null, Date.now() + path.extname(file.originalname));
// //   }
// // });

// // const upload = multer({ 
// //   storage: storage,
// //   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
// //   fileFilter: (req, file, cb) => {
// //     const filetypes = /jpeg|jpg|png/;
// //     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
// //     const mimetype = filetypes.test(file.mimetype);
    
// //     if (extname && mimetype) {
// //       return cb(null, true);
// //     } else {
// //       cb('Error: Images only (jpeg, jpg, png)!');
// //     }
// //   }
// // });

// // router.post("/face-verification", upload.single("image"), async (req, res) => {
// //   try {
// //     if (!req.file) {
// //       return res.status(400).json({ error: "No image file provided" });
// //     }

// //     // Here you would normally process the image with your face recognition logic
// //     // For now, we'll mock a successful response
// //     const mockResponse = {
// //       verified: true,
// //       name: "John Doe",
// //       userId: "12345",
// //       role: "user"
// //     };

// //     // Clean up the uploaded file
// //     fs.unlinkSync(req.file.path);

// //     return res.json(mockResponse);
    
// //   } catch (error) {
// //     console.error("Face verification error:", error);
    
// //     // Clean up file if it exists
// //     if (req.file && fs.existsSync(req.file.path)) {
// //       fs.unlinkSync(req.file.path);
// //     }
    
// //     return res.status(500).json({ 
// //       error: "Internal server error",
// //       details: error.message 
// //     });
// //   }
// // });


  
// module.exports = router;
