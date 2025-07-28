const User = require("../models/user.model");
const Feed = require("../models/feed.model");

const formidable = require("formidable");
const cloudinary = require("../config/cloudinary");
const { post } = require("../routers/api.router");


// Create New Feed

exports.createFeed = async (req, res) => {
    try {
        const { title, content } = req.body;

        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required",
                error: "ValidationError"
            });
        }

        // Initialize feed object
        const feed = new Feed({
            title: String(title).trim(),
            content: String(content).trim(),
            author: req.user._id,
        });

        // Handle file upload (if present)
        if (req.file) {
            try {
                // Validate file size and type again (redundant but safe)
                const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
                if (!validTypes.includes(req.file.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid file type. Only images (JPEG, PNG, GIF) and MP4 videos are allowed',
                        error: "InvalidFileType"
                    });
                }

                // Upload to Cloudinary
                const uploaded = await cloudinary.uploader.upload(req.file.path, {
                    folder: "ZyloHR/Feeds",
                    resource_type: "auto",
                    quality: "auto:good" // Optimize quality
                });

                feed.media = {
                    url: uploaded.secure_url,
                    public_id: uploaded.public_id,
                    type: req.file.mimetype,
                    width: uploaded.width,
                    height: uploaded.height,
                    duration: uploaded.duration // For videos
                };
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload media",
                    error: "MediaUploadError"
                });
            }
        }

        // Save the feed and populate author details
        const savedFeed = await feed.save();
        const populatedFeed = await Feed.findById(savedFeed._id)
            .populate("author", "name email avatar role");

        res.status(201).json({
            success: true,
            message: "Feed created successfully",
            data: {
                ...populatedFeed.toObject(),
                // Add any additional transformations here
            }
        });

    } catch (error) {
        console.error("Error creating feed:", error);

        // Handle specific errors
        let statusCode = 500;
        let errorMessage = "Internal server error";

        if (error.name === "ValidationError") {
            statusCode = 400;
            errorMessage = "Validation failed";
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

// Get All Feeds
exports.getAllFeeds = async (req, res) => {
    try {
        const feeds = await Feed.find()
            .populate("author", "-password -secretKey -tokens")
            .sort({ createdAt: -1 });

        if (!feeds) {
            return res.status(404).json({ message: "Feeds not found !" });
        }

        return res.status(200).json({
            success: true,
            message: "All Feeds Fetched Successfully !",
            data: feeds,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in Getting All Feeds !",
            error: error.message,
        });
    }
};

// Update Feed
exports.updateFeed = async (req, res) => {
    try {
        const { id } = req.params;
        const form = new formidable.Formidable({
            multiples: false,
            keepExtensions: true,
            maxFileSize: 200 * 1024 * 1024, // 200MB Limit
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(400).json({
                    message: "Error in Form Parse!",
                    error: err.message,
                });
            }

            const feed = await Feed.findById(id);
            if (!feed) {
                return res.status(404).json({ message: "Feed not found!" });
            }

            if (!req.user || !req.user._id || feed.author.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: "Unauthorized: You cannot update this feed" });
            }

            const text = Array.isArray(fields.text) ? fields.text.join(" ") : fields.text?.toString();
            if (text) feed.text = text;

            const mediaFile = files.media;
            const mediaPath = mediaFile?.filepath || (Array.isArray(mediaFile) ? mediaFile[0]?.filepath : null);

            if (mediaPath) {
                if (feed.public_id) {
                    await cloudinary.uploader.destroy(feed.public_id);
                }

                const uploadedFeed = await cloudinary.uploader.upload(mediaPath, {
                    folder: "ZyloHR/Feeds",
                });

                if (!uploadedFeed) {
                    return res.status(400).json({ message: "Error while Uploading Feed!" });
                }

                feed.media = uploadedFeed.secure_url;
                feed.public_id = uploadedFeed.public_id;
            }

            const updatedFeed = await feed.save();

            res.status(200).json({
                success: true,
                message: "Feed Updated Successfully!",
                updatedFeed,
            });
        });
    } catch (error) {
        console.error("Error in updateFeed:", error);
        res.status(500).json({
            success: false,
            message: "Error in Update Feed!",
            error: error.message,
        });
    }
};

// Delete Feed
exports.deleteFeed = async (req, res) => {
    try {
        const { id: feedId } = req.params;

        // Find the Feed by ID
        const feed = await Feed.findById(feedId);
        if (!feed) {
            return res.status(404).json({
                message: "Feed not found"
            });
        }

        // Delete Feed from Cloudinary
        if (feed.media) {
            const feedPublicId = feed.public_id;
            await cloudinary.uploader.destroy(feedPublicId);
        }

        // Remove the feed from database
        await Feed.findByIdAndDelete(feedId);

        await User.findByIdAndUpdate(feed.author._id, {
            $pull: { feeds: feedId }
        });


        return res.status(200).json({
            success: true,
            message: "Feed deleted successfully",
            data: feed
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in Delete Feed !",
            error: error.message
        });
    }
};

// Get Feed by user ID
exports.getFeedByUserId = async (req, res) => {
    try {
        const { id: userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required !"
            });
        }

        const feeds = await Feed.find({ author: userId })
            .populate("author", "-password -secretKey -tokens")
            .sort({ createdAt: -1 });

        if (!feeds) {
            return res.status(404).json({ message: "Feeds not found !" });
        }

        return res.status(200).json({
            success: true,
            message: "All Feeds Fetched Successfully !",
            data: feeds,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in Getting All Feeds !",
            error: error.message,
        });
    }
};

// Like-Unlike Feed
exports.likeUnlikeFeed = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "Feed ID is required !"
            });
        }

        const feed = await Feed.findById(id);
        if (!feed) {
            return res.status(404).json({
                message: "Feed not found !"
            });
        }

        if (feed.likes.includes(req.user._id)) {
            await Feed.findByIdAndUpdate(
                id,
                { $pull: { likes: req.user._id } },
                { new: true }
            );
            return res.status(200).json({
                success: true,
                message: "Feed Unliked Successfully !"
            });
        } else {
            await Feed.findByIdAndUpdate(
                id,
                { $push: { likes: req.user._id } },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: "Feed Liked Successfully !"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in Like/Unlike Feed !",
            error: error.message

        });
    }
};

// AddComment on Feed
exports.addCommentOnFeed = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!id) {
            return res.status(400).json({
                message: "Feed ID is required !"
            });
        }

        if (!text) {
            return res.status(400).json({
                message: "Comment Text is required !"
            });
        }

        const feed = await Feed.findById(id);
        if (!feed) {
            return res.status(404).json({
                message: "Feed not found !"
            });
        }

        const newComment = {
            user: req.user._id,
            text
        };
        await Feed.findByIdAndUpdate(
            id,
            { $push: { comments: newComment } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Comment Added Successfully !",
            post: feed._id,
            data: newComment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in Adding Comment on Feed !",
            error: error.message
        });

    }
}

// DeleteComment on Feed
exports.deleteCommentOnFeed = async (req, res) => {
    try {
        const { feedId, commentId } = req.params;

        if (!feedId) {
            return res.status(400).json({
                message: "Feed ID is required !"
            });
        }

        if (!commentId) {
            return res.status(400).json({
                message: "Comment ID is required !"
            });
        }

        const feed = await Feed.findById(feedId);
        if (!feed) {
            return res.status(404).json({
                message: "Feed not found !"
            });
        }

        const deletedFeed = await Feed.findByIdAndUpdate(
            feedId,
            { $pull: { comments: { _id: commentId } } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Comment Deleted Successfully !",
            data: deletedFeed.comments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in Deleting Comment on Feed !",
            error: error.message
        });
    }
}

//UpdateComment on Feed
// exports.updateCommentOnFeed = async (req, res) => {
//     try {
//         const { feedId, commentId } = req.params;
//         const { text } = req.body;

//         if (!feedId) {
//             return res.status(400).json({
//                 message: "Feed ID is required !"
//             });
//         }

//         if (!commentId) {
//             return res.status(400).json({
//                 message: "Comment ID is required !"
//             });
//         }

//         if (!text) {
//             return res.status(400).json({
//                 message: "Comment Text is required !"
//             });
//         }

//         const feed = await Feed.findById(feedId);
//         if (!feed) {
//             return res.status(404).json({
//                 message: "Feed not found !"
//             });
//         }

//         const updatedFeed = await Feed.findByIdAndUpdate(
//             feedId,
//             { $set: { comments: { _id: commentId, text: text } } }
//         );

//         // const updatedFeed = await Feed.findByIdAndUpdate(
//         //     feedId,
//         //     { $pull: { comments: { _id: commentId, text: text } } }
//         // );

//         // if (!updatedFeed) {
//         //     return res.status(404).json({
//         //         message: "Comment not found !"
//         //     });
//         // }
//         // await Feed.findByIdAndUpdate(
//         //     feedId,
//         //     { $push: { comments: { user: req.user._id, text } } },
//         //     { new: true }
//         // )

//         return res.status(200).json({
//             success: true,
//             message: "Comment Updated Successfully !",
//             data: updatedFeed.comments
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error in Updating Comment on Feed !",
//             error: error.message
//         });
//     }
// };