const mongoose = require("mongoose");
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL,{
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log("MongoDB connected SUCCESSFULLY...");
    } catch (error) {
        console.error("MongoDB connection FAILED !", error.message);
    }
};

module.exports = connectDB;
