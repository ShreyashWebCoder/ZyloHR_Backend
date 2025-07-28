const User = require("../models/user.model");
const Attendance = require("../models/attendance.model");
// const { default: mongoose } = require("mongoose");


exports.punchIn = async (req, res) => {
    try {
      
        
        const { employeeId } = req.body;
        console.log("Received employeeId:", employeeId);

        if (!employeeId) {
            return res.status(404).json({ message: "Employee ID is required" });
        }

        // if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        //     return res.status(400).json({ message: "Invalid employee ID format" });
        // }

        // Check if employee exists
        const employee = await User.findById(employeeId).select("-password");

        // console.log("Found employee:", employee._id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        console.log("Employee ID:", employeeId);
        console.log("Employee Data:", employee.email);

        // Check if already punched in today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
            employeeId,
            punchIn: { $gte: todayStart, $lte: todayEnd },
        });

        if (existingAttendance && !existingAttendance.punchOut) {
            return res.status(400).json({ message: "Already punched in today" });
        }

        // Create new attendance record
        const attendance = new Attendance({
            employeeId,
            punchIn: new Date(),
            status: "present",
            // location: {
            //   type: "Point",
            //   coordinates: [longitude, latitude] 
            // },
            // distanceFromOffice: calculatedDistance
        });

        
        if (!attendance) {
            console.log("Failed to create attendance record");

            return res.status(400).json({ message: "Attendance record not created" });
        }
        await attendance.save();
        console.log("Attendance Record:", attendance);
        return res.status(201).json({
            success: true,
            message: "Punched in successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Punch in error:", error.message);
        res.status(500).json({
            success: false,
            message: "Error punching in",
            error: error.message,
        });
    }
};

// @desc    Punch out
// @route   POST /api/attendance/punch-out
// @access  Private
exports.punchOut = async (req, res) => {
    try {
        const { employeeId } = req.body;

        // Check if employee exists
        const employee = await User.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Find today's punch in record
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const attendance = await Attendance.findOne({
            employeeId,
            punchIn: { $gte: todayStart, $lte: todayEnd },
            punchOut: { $exists: false },
        });

        if (!attendance) {
            return res.status(400).json({ message: "No active punch in found for today" });
        }

        // Update attendance record
        attendance.punchOut = new Date();
        await attendance.save();

        res.status(200).json({
            success: true,
            message: "Punched out successfully",
            data: attendance,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error punching out",
            error: error.message,
        });
    }
};

// @desc    Get today's attendance
// @route   GET /api/attendance/today/:employeeId
// @access  Private
exports.getTodayAttendance = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const attendance = await Attendance.findOne({
            employeeId,
            punchIn: { $gte: todayStart, $lte: todayEnd },
        });

        res.status(200).json({
            success: true,
            data: attendance || null,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching today's attendance",
            error: error.message,
        });
    }
};

// @desc    Get attendance records
// @route   GET /api/attendance/records/:employeeId
// @access  Private
exports.getAttendanceRecords = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const records = await Attendance.find({ employeeId })
            .sort({ punchIn: -1 })
            .limit(30);

        res.status(200).json({
            success: true,
            data: records,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching attendance records",
            error: error.message,
        });
    }
};






// exports.createAttendance = async (req, res) => {
//     try {
//         const { userId, date, inTime, outTime, status, remarks } = req.body;

//         if (!userId) {
//             return res.status(400).json({
//                 message: "User ID is required!",
//             });
//         }

//         if (!date || !inTime || !outTime || !status) {
//             return res.status(400).json({ message: "All fields are required !" });
//         }

//         const user = await User.findById(userId).select("-password");
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         const attendance = new Attendance({
//             userId: user._id,
//             userName: user.name,
//             date,
//             inTime,
//             outTime,
//             status,
//             remarks
//         });
//         await attendance.save();

//         user.attendance.push(attendance._id);
//         await user.save();

//         return res.status(201).json({
//             success: true,
//             message: "Attendance Record Created Successfully !",
//             data: attendance
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error in Create Attendance !",
//             error: error.message
//         });
//     }
// };

// // Get All Attendance Records
// exports.getAllAttendance = async (req, res) => {
//     try {
//         const attendances = await Attendance.find()
//             .populate("userName")
//             .select("-password")
//             .sort({ createdAt: -1 });

//         if (!attendances) {
//             return res.status(404).json({ message: "Attendance not found !" });
//         }

//         return res.status(200).json({
//             success: true,
//             message: "All Attendance Records Fetched Successfully !",
//             data: attendances
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error in Getting All Attendances !",
//             error: error.message
//         });
//     }
// };

// // Get My Attendance
// exports.getMyAttendance = async (req, res) => {
//     try {
//         const attendances = await Attendance.find({ userId: req.user._id })
//             .populate("userId")
//             .select("-password")
//             .sort({ createdAt: -1 });

//         if (!attendances) {
//             return res.status(404).json({ message: "Attendance not found !" });
//         }

//         return res.status(200).json({
//             success: true,
//             message: "My Attendance Records Fetched Successfully !",
//             data: attendances
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error in Getting My Attendances !",
//             error: error.message
//         });
//     }
// }

// // update Attendance Record
// exports.updateAttendance = async (req, res) => {
//     try {
//         const { userId, date, inTime, outTime, status, remarks } = req.body;
//         const { id } = req.params;

//         if (!userId) {
//             return res.status(400).json({
//                 message: "User ID is required!",
//             });
//         }

//         if (!date || !inTime || !outTime || !status) {
//             return res.status(400).json({ message: "All fields are required !" });
//         }

//         const user = await User.findById(userId).select("-password");
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         const attendance = await Attendance.findByIdAndUpdate(
//             id,
//             {
//                 userId: user._id,
//                 date,
//                 inTime,
//                 outTime,
//                 status,
//                 remarks
//             },
//             { new: true }
//         );

//         if (!attendance) {
//             return res.status(404).json({ message: "Attendance not found !" });
//         }
//         await attendance.save();

//         return res.status(200).json({
//             success: true,
//             message: "Attendance Record Updated Successfully !",
//             data: attendance
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error in Update Attendance !",
//             error: error.message
//         });
//     }
// };

// // Delete Attendance Record
// exports.deleteAttendance = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const attendance = await Attendance.findByIdAndDelete(id);

//         if (!attendance) {
//             return res.status(404).json({ message: "Attendance not found !" });
//         }

//         await User.findByIdAndUpdate(
//             attendance.userId,
//             {
//                 $pull: { attendance: id }

//             }
//         );

//         return res.status(200).json({
//             success: true,
//             message: "Attendance Record Deleted Successfully !",
//             data: attendance
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Error in Delete Attendance !",
//             error: error.message
//         });
//     }
// };
