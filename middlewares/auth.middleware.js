const { verifyToken } = require('../config/jwt');
const User = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
    const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            message: "Authentication failed! No token provided."
        })
    };
    // console.log("🎟️ JWT_Token: ", token);

    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                message: "Invalid decoded token."
            })
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                message: " User not found."
            })
        }

        req.user = user;
        next();


    } catch (err) {
        console.error("❌ JWT Error: ", err);

        res.clearCookie("token");
        // res.status(400).json({ message: 'Invalid token' });
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(400).json({ message: 'Invalid token' });

    }
};

module.exports = authMiddleware;