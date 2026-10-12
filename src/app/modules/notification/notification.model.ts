import mongoose, { Schema } from 'mongoose';
import { INotification, INotificationModel } from './notification.interface';

const notificationSchema = new Schema<INotification, INotificationModel>(
  {
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    text: {
      type: String,
    },
    refId: {
      type: Schema.Types.Mixed,
    },
    referenceId: {
      type: String,
    },
    path: {
      type: String,
      default: '/',
    },
    screen: {
      type: String,
    },
    deleteReferenceId: {
      type: Schema.Types.ObjectId,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: 'GENERAL',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-sync backward compatible fields before validation
notificationSchema.pre('validate', function (next) {
  if (!this.title && this.text) {
    this.title = this.text;
  }
  if (!this.message && (this.text || this.title)) {
    this.message = this.text || this.title;
  }
  if (!this.text && (this.message || this.title)) {
    this.text = this.message || this.title;
  }
  if (this.seen !== undefined && this.read === undefined) {
    this.read = this.seen;
  }
  if (this.read !== undefined && this.seen === undefined) {
    this.seen = this.read;
  }
  if (!this.path && this.screen) {
    this.path = `/${this.screen.toLowerCase()}`;
  }
  if (!this.refId && this.referenceId) {
    this.refId = this.referenceId;
  }
  if (!this.referenceId && this.refId) {
    this.referenceId = this.refId.toString();
  }
  next();
});

notificationSchema.index({ receiver: 1, seen: 1, createdAt: -1 });
notificationSchema.index({ receiver: 1, read: 1 });
notificationSchema.index({ type: 1 });

export const Notification = mongoose.model<INotification, INotificationModel>(
  'Notification',
  notificationSchema
);
