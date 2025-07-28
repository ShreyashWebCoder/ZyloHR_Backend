const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const User = require("../models/user.model");
const { generateToken } = require('../config/jwt');

const register = async (req, res) => {
    try {
        const { name, email, password, role, phone, birthday,
            status, secretKey, department } = req.body;

        if (!name || !email || !password || !role || !phone) {
            return res.status(400).json({ message: "All fields are required!" });

        }

        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({ message: "User already registered! Please Login." });

        }

        let hashedSecretKey = null;

        // Role-based Secret Key Validation (Only for Admin & Manager)
        if (role === "admin" || role === "manager") {
            if (!secretKey) {
                return res.status(400).json({ message: "Secret Key is required for Admin & Manager!" });

            }

            const validSecretKey =
                role === "admin" ? process.env.ADMIN_SECRET_KEY : process.env.MANAGER_SECRET_KEY;

            if (secretKey !== validSecretKey) {
                return res.status(403).json({ message: `Invalid ${role} Secret Key!` });

            }

            hashedSecretKey = await bcrypt.hash(secretKey, 10);
            if (!hashedSecretKey) {
                return res.status(400).json({ message: "Secret Key hashing failed!" });
            }
        }


        const user = new User({
            name,
            email,
            password,
            role,
            phone,
            birthday,
            department,
            status,
            secretKey: hashedSecretKey

        });

        const newUser = await user.save();
        if (!newUser) {
            return res.status(400).json({ message: "User registration failed!" });
        }

        // const token = generateToken(user._id, user.role);
        // res.status(201).json({ user, token });

        return res.status(201).json({
            success: true,
            message: `Registered ${newUser.role} Successfully! Welcome ${newUser.name}`,
            data: newUser
        });

    } catch (err) {
        console.log(err);

        return res.status(400).json({
            success: false,
            message: 'Registration failed', error: err.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email & Password are required !",
            });
        }

        const userExist = await User.findOne({ email });
        if (!userExist) {
            return res.status(400).json({
                message: "Please Register First !",
            });
        }

        const passwordVaild = await bcrypt.compare(password, userExist.password);
        if (!passwordVaild) {
            return res.status(400).json({
                message: "Invalid Credentials !",
            });
        }

        const token = generateToken(userExist._id, userExist.role);
        if (!token) {
            return res.status(400).json({
                message: "Token generation Failed in Login !",
            });
        }

        // Remove password from the response
        const { password: _, secretKey: __, ...userWithoutPassword } = userExist._doc;


        const role = userExist.role;
        res.cookie("token", token, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: false,
            sameSite: "none"
        }).cookie("role", role, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: false,
            sameSite: "none"
        });

        return res.status(200).json({
            success: true,
            message: `User Login Successfully ! Welcome ${userExist.name}`,
            data: userWithoutPassword,
            token: token
        });
    } catch (err) {
        console.log(err);

        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: err.message
        });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie("token");
        res.clearCookie("role");
        res.status(200).json({
            success: true,
            message: `User Logout Successfully !`,
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error in Logout !",
            error: error.message,
        });
    }
}

module.exports = { register, login, logout };