const Announcement = require("../models/announcement.model");
const User = require("../models/user.model");


// Create Announcement
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "All fields are required !" });
        }

        // Ensure user is attached to request
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: "Unauthorized! User not found."
            });
        }

        const announcement = new Announcement({
            title,
            content,
            createdBy: req.user._id
        });

        if (!announcement) {
            return res.status(400).json({ message: "Announcement not created !" });
        }

        await announcement.save();

        return res.status(200).json({
            success: true,
            message: "Announcement Created Successfully !",
            data: announcement
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in Creating Announcement !",
            error: error.message
        });
    }
}

// Get All Announcements
exports.getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().populate("createdBy","-password -secretKey -tokens", )
            .sort({ createdAt: -1 });

        if (!announcements) {
            return res.status(404).json({ message: "Announcement not found !" });
        }
        return res.status(200).json({
            success: true,
            message: "Announcements Fetched Successfully !",
            data: announcements
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in Getting Announcements !",
            error: error.message
        });
    }
}

// Delete Announcement
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findByIdAndDelete(id);

        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found !" });
        }

        return res.status(200).json({
            success: true,
            message: "Announcement Deleted Successfully !",
            data: announcement
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in Delete Announcement !",
            error: error.message
        });
    }

};
