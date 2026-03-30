import { Schema, model } from "mongoose";
import { IWeeklyReport } from "./report.interface";

const weeklySchema = new Schema<IWeeklyReport>({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },
    isPresent: { type: Boolean, required: true },
    achievedHardOutcomes: { type: [String], required: false },
    whatDidYouWorkOnThisWeek: { type: String, required: false},
    whatProgressDidTheStudentMake:{ type: String, required: false}, 
    highLightAchivementsAndImprove:{ type: String, required: false},
    planForNextWeek: { type: String, required: false},
    softSkillImprovements: { type: [String], required: false },
    comments: { type: String },
    goalSheet: {
        skillName: { type: String, required: false },
        plannedProgress: { type: Number, required: false },
        actualProgress: { type: Number, required:  false },
    },
    objectives: { type: String, required: false },
}, {
 
    timestamps: true
 });

export const WeeklyReport = model<IWeeklyReport>('WeeklyReport', weeklySchema);