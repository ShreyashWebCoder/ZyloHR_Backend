const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
    console.log("JWT Secret: ", process.env.JWT_SECRET);
    
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const verifyToken = (token) => {
    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );
};

module.exports = { generateToken, verifyToken };