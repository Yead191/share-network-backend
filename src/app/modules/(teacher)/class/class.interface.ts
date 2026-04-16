import { Model, Types } from 'mongoose';
import { IUser } from '../../user/user.interface';

export type IClass = {
  title: string;
  teacher: Types.ObjectId | IUser;
  studentId: Types.ObjectId | IUser;
  description: string;
  classDate: Date;
  location: string;
  virtualClass: boolean;
  file: string;
  slideUrl: string;
  published: boolean;
  status: boolean;
  userGroup: Types.ObjectId[];
  userGroupTrack: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: string;
};

export type ClassModel = Model<IClass, Record<string, unknown>>;
