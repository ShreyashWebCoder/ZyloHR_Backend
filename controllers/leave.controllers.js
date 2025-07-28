

const Leave = require("../models/leave.model");

exports.getAllLeaves = async (req, res) => {
  try {
    let query = {};

    // If user is employee, only return their leaves
    if (req.user.role === 'employee') {
      query.employeeName = req.user.name;
    }

    // If employeeName query parameter is provided (for managers/admins filtering)
    if (req.query.employeeName) {
      query.employeeName = req.query.employeeName;
    }

    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error("Error fetching leaves:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching leaves."
    });
  }
};

// exports.createLeave = async (req, res) => {
//   try {
//     let { employeeName, employeeId, isManualEntry, leaveType, startDate, endDate, reason, status } = req.body;

//     // For employees, force their own name
//     if (req.user.role === 'employee') {
//       employeeName = req.user.name;
//       employeeId = req.user._id;
//       isManualEntry = false;
//       status = 'pending';
//     }

//     // For admin/manager, validate manual entries
//     if ((req.user.role === 'admin' || req.user.role === 'manager') && !isManualEntry && !employeeId) {
//       return res.status(400).json({
//         success: false,
//         message: "Please select an employee or mark as manual entry"
//       });
//     }

//     // Format dates
//     const formatDate = (dateStr) => {
//       const date = new Date(dateStr);
//       const day = String(date.getDate()).padStart(2, "0");
//       const month = String(date.getMonth() + 1).padStart(2, "0");
//       const year = date.getFullYear();
//       return `${day}-${month}-${year}`;
//     };

//     const newLeave = new Leave({
//       employeeName,
//       employeeId: isManualEntry ? null : employeeId,
//       isManualEntry,
//       leaveType,
//       startDate: formatDate(startDate),
//       endDate: formatDate(endDate),
//       reason,
//       status: status || "pending",
//       approvedBy: status === 'approved' ? req.user._id : undefined
//     });

//     const savedLeave = await newLeave.save();
//     return res.status(201).json({ success: true, data: savedLeave });
//   } catch (error) {
//     console.error("Error creating leave:", error.message);
//     return res.status(400).json({
//       success: false,
//       message: "Invalid data",
//       error: error.message
//     });
//   }
// };


exports.createLeave = async (req, res) => {
  try {
    let { employeeName, employeeId, isManualEntry, leaveType, startDate, endDate, reason, status } = req.body;

    if (req.user.role === 'employee') {
      employeeName = req.user.name;
      employeeId = req.user._id;
      isManualEntry = false;
      status = 'pending';
    }

    if ((req.user.role === 'admin' || req.user.role === 'manager') && !isManualEntry && !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Please select an employee or mark as manual entry"
      });
    }

    const newLeave = new Leave({
      employeeName,
      employeeId: isManualEntry ? null : employeeId,
      isManualEntry,
      leaveType,
      startDate: new Date(startDate), // ✅ Correct
      endDate: new Date(endDate),     // ✅ Correct
      reason,
      status: status || "pending",
      approvedBy: status === 'approved' ? req.user._id : undefined
    });

    const savedLeave = await newLeave.save();
    return res.status(201).json({ success: true, data: savedLeave });
  } catch (error) {
    console.error("Error creating leave:", error.message);
    return res.status(400).json({
      success: false,
      message: "Invalid data",
      error: error.message
    });
  }
};

exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    // Authorization checks
    if (req.user.role === 'employee') {
      // Employees can only update their own leaves (except status)
      if (leave.employeeName !== req.user.name) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this leave"
        });
      }
      // Employees can't change status
      if (req.body.status && req.body.status !== leave.status) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to change leave status"
        });
      }
    }

    // Managers can't approve their own leaves
    if (req.user.role === 'manager' &&
      leave.employeeName === req.user.name &&
      req.body.status === 'approved') {
      return res.status(403).json({
        success: false,
        message: "Managers cannot approve their own leaves"
      });
    }

    // Format dates if they're being updated
    if (req.body.startDate) {
      req.body.startDate = formatDate(req.body.startDate);
    }
    if (req.body.endDate) {
      req.body.endDate = formatDate(req.body.endDate);
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedLeave
    });
  } catch (error) {
    console.error("Error updating leave:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


exports.deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    // Authorization check
    if (req.user.role !== 'admin' &&
      req.user.role !== 'manager' &&
      leave.employeeName !== req.user.name) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this leave"
      });
    }

    await Leave.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Leave deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting leave:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting leave."
    });
  }
};

// Helper function to format dates
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}