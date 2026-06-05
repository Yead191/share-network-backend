import { Document, Types } from 'mongoose';
export interface IEvent extends Document {
    title: string;
    description?: string;
    image: string;
    date: Date;
    location?: string;
    type: 'webinar' | 'workshop' | 'seminar' | 'conference';
    studentAssigned: Types.ObjectId[];
    status: 'active' | 'inactive';
    group: Types.ObjectId;
    targetTrack: Types.ObjectId;
    targetGroup: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}