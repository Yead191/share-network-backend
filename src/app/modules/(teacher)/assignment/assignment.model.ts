import { model, Schema } from 'mongoose';
import { AssignmentModel, IAssignment } from './assignment.interface';

const assignmentSchema = new Schema<IAssignment, AssignmentModel>(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    submitAssignment: [
      {
        type: Schema.Types.ObjectId,
        ref: 'AssignmentsSub',
      },
    ],

    title: {
      type: String,
      required: true,
    },

    published: {
      type: Boolean,
      default: true,
    },

    description: {
      type: String,
      required: true,
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

    dueDate: {
      type: Date,
      required: true,
    },
    
    totalPoint: {
      type: Number,
      default: 0,
    },

    attachment: {
      type: String
    },
    
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING',
    },
  
  },
  { timestamps: true }
);
assignmentSchema.index({ userGroup: 1, userGroupTrack: 1 });
export const Assignment = model<IAssignment, AssignmentModel>('Assignment', assignmentSchema);
