import { Schema, model } from "mongoose";
import { IClassAttendance } from "./attendance.interface";

const classAttendanceSchema = new Schema<IClassAttendance>({
    date: {
        type: Date,
        required: true,
    },
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'UserGroup',
        required: true
    },
    takenBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    records: [{
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'excused'],
            default: 'present',
            required: true
        },
        note: { type: String, trim: true, default: '' }
    }]
}, {
    timestamps: true
});

classAttendanceSchema.index({ date: 1, groupId: 1 }, { unique: true });

export const ClassAttendance = model<IClassAttendance>('ClassAttendance', classAttendanceSchema);