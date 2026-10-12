import { model, Schema } from 'mongoose';
import { ClassModel, IClass } from './class.interface';

const classSchema = new Schema<IClass, ClassModel>(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    studentId: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    ],
    studentAssigned: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    ],
    file: {
      type: String,
      required: false,
    },
    slideUrl: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    classDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    virtualClass: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
    published: {
      type: Boolean,
      default: true,
    },
    userGroup: [
      {
        type: Schema.Types.ObjectId,
        ref: 'UserGroup',
        required: false,
      },
    ],
    userGroupTrack: {
      type: Schema.Types.ObjectId,
      ref: 'UserGroupTrack',
      required: false,
    },
  },
  { timestamps: true }
);

classSchema.index({ userGroup: 1 });
classSchema.index({ studentAssigned: 1 });
classSchema.index({ studentId: 1 });
classSchema.index({ userGroupTrack: 1 });

export const Class = model<IClass, ClassModel>('Class', classSchema);
