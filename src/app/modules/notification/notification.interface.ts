import { Model, Types } from 'mongoose';

export interface INotification {
  receiver: Types.ObjectId;
  sender?: Types.ObjectId | null;
  title: string;
  message?: string;
  text?: string;
  refId?: Types.ObjectId | string;
  referenceId?: string;
  path?: string;
  screen?: string;
  deleteReferenceId?: Types.ObjectId;
  seen?: boolean;
  read?: boolean;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type INotificationModel = Model<INotification>;
export type NotificationModel = Model<INotification>;