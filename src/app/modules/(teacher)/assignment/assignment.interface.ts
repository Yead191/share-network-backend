import { Model, Types } from 'mongoose';

export type IAssignment = {
  title: string;
  teacher: Types.ObjectId;
  published: boolean;
  description: string;
  userGroup?: Types.ObjectId[];
  studentAssigned?: Types.ObjectId[];
  userGroupTrack: Types.ObjectId;
  dueDate: Date;
  totalPoint?: number; 
  attachment?: string;
  submitAssignment?: Types.ObjectId;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: string;
};

export type AssignmentModel = Model<IAssignment, Record<string, unknown>>;
