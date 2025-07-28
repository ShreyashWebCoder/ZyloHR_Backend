const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
});

console.log('🤩 Cloudinary config:',
    {
        cloud_name: process.env.CLOUD_NAME ? 'set' : 'missing',

        api_key: process.env.CLOUD_API_KEY ? 'set' : 'missing'
    }
);

module.exports = cloudinary;

