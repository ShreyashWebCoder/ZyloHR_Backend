const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            // required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        punchIn: {
            type: Date,
            required: true,
        },
        punchOut: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["present", "absent", "leave", "late", "half-day"],
            default: "present",
        },
        // location: {
        //     type: {
        //         type: String,
        //         default: "Point",
        //         enum: ["Point"],
        //         // required: true
        //     },
        //     coordinates: {
        //         type: [Number],
        //         // required: true,
        //         validate: {
        //             validator: function (v) {
        //                 return v.length === 2 &&
        //                     typeof v[0] === 'number' &&
        //                     typeof v[1] === 'number';
        //             },
        //             message: props => `${props.value} must be an array of two numbers [longitude, latitude]`
        //         }
        //     }
        // },
        // distanceFromOffice: {
        //     type: Number,
        //     required: false,
        // },
    },
    { timestamps: true }
);

// Index for geospatial queries
attendanceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Attendance", attendanceSchema);
