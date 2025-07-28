const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
    employeeName: {
        type: String,
        required: [true, 'Employee name is required'],
    trim: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
          return this.employeeName && !this.isManualEntry;
        }
      },
      isManualEntry: {
        type: Boolean,
        default: false
      },
    leaveType: {
        type: String,
        required: [true, 'Leave type is required'],
        enum: ['Casual', 'Sick', 'Earned', 'Other']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']

    },
    endDate: {
        type: Date,
        equired: [true, 'End date is required']
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }

}, { timestamps: true });

module.exports = mongoose.model("Leave", leaveSchema);
