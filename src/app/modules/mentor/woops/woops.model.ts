import { Schema, model } from "mongoose";
import { IWoopGoal } from "./woops.interface";
import WoopSectionSchema from "./woops.sub.model";

const WoopGoalSchema = new Schema<IWoopGoal>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        mentorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        goal: {
            type: Schema.Types.ObjectId,
            ref: 'Goal',
            required: false
        },

        woop: {
            type: WoopSectionSchema,
            required: false,
        },

        wish: {
            type: WoopSectionSchema,
            required: false,
        },
        outcome: {
            type: WoopSectionSchema,
            required: false,
        },
        obstacle: {
            type: WoopSectionSchema,
            required: false,
        },
        plan: {
            type: WoopSectionSchema,
            required: false,
        },


        progress: {
            type: Number,
            default: 0,
        },
        nextSessionDate: {
            type: Date,
        },
        isCompleted: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export const WoopGoal = model<IWoopGoal>('WoopGoal', WoopGoalSchema);