import { Types } from "mongoose";

export interface IWoopSection {
    // mainData: string; 
    detail: string;
    // summary: string;  
}

export interface IWoopGoal extends Document {
    studentId?: Types.ObjectId;
    mentorId?: Types.ObjectId;
    goal?: Types.ObjectId;

    woop: IWoopSection;
    wish: IWoopSection;
    outcome: IWoopSection;
    obstacle: IWoopSection;
    plan: IWoopSection;

    progress: number;
    nextSessionDate?: Date;
    isCompleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
