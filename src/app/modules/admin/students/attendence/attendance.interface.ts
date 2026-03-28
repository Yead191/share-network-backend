import { Document, Types } from "mongoose";

export type IAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type IStudentAttendanceDetail = {
    studentId: Types.ObjectId; 
    status: IAttendanceStatus; 
    note?: string;           
};

export interface IClassAttendance extends Document {
    date: Date;                
    groupId: Types.ObjectId; 
    takenBy: Types.ObjectId;  
    records: IStudentAttendanceDetail[]; 
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}