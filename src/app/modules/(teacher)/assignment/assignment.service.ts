import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import QueryBuilder from '../../../../shared/apiFeature';
import { IAssignment } from './assignment.interface';
import { Assignment } from './assignment.model';
import { UserGroupTrack } from '../../user-group/user-group-track/user-group-track.model';
import { UserGroup } from '../../user-group/user-group.model';
import { RecentActivity } from '../recentActivities/recentActivity.model';
import { AssignmentsSub } from '../../students/assignments/assignmentsSub.model';
import mongoose from 'mongoose';

const createAssignmentToDB = async (payload: IAssignment) => {

  payload.totalPoint = Number(payload.totalPoint);

  if(payload.userGroupTrack){
    const isUserGroupTrackExist = await UserGroupTrack.exists({
      _id: payload.userGroupTrack
    });
    if(!isUserGroupTrackExist){
      throw new ApiError(StatusCodes.NOT_FOUND, "User Group Track Id not found!");
    }
  }
  if(payload.userGroup){
    const isUserGroupExist = await UserGroup.exists({_id: {$in: payload.userGroup}});
    if(!isUserGroupExist){
      throw new ApiError(StatusCodes.NOT_FOUND, "User Group Id not found!");
    }
  }
  const result = await Assignment.create(payload);

  // Create recent activity
  RecentActivity.create({
    title: `${result.title}`,
    description: ` ${result.description}`,
    type: "ASSIGNMENT",
    user: result.teacher,
    referenceId: result._id,
  });

  return  result ;
};

const getAllAssignmentsFromDB = async (query: Record<string, any>) => {
    const searchableFields = ['title', 'type', 'userGroupTrack', 'userGroup'];

    const preFilter: Record<string, any> = {};

    if (query.userGroup) {
        preFilter.userGroup = new mongoose.Types.ObjectId(query.userGroup as string);
        delete query.userGroup; 
    }

    if (query.userGroupTrack) {
        preFilter.userGroupTrack = new mongoose.Types.ObjectId(query.userGroupTrack as string);
        delete query.userGroupTrack;
    }

    const result = new QueryBuilder(
        Assignment.find(preFilter) 
            .populate('userGroup')
            .populate('userGroupTrack')
            .populate({
                path: 'submitAssignment',
                populate: [
                    {
                        path: 'assignmentId',
                        model: 'Assignment',
                        select: 'title description'
                    },
                    {
                        path: 'studentId',
                        model: 'User',
                        select: 'name email mobilenumber role'
                    }
                ]
            }),
        query
    )
        .search(searchableFields)
        .filter()
        .sort()
        .paginate();

    const assignments = await result.queryModel;
    const pagination = await result.getPaginationInfo();
    return { assignments, pagination };
};
const getAssignmentByIdFromDB = async (id: string) => {
  const result = await Assignment.findById(id).populate('userGroup').populate('userGroupTrack');
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Assignment doesn't exist!");
  }
  return result;
};

// const updateAssignmentToDB = async (id: string, payload: Partial<IAssignment>) => {

//   if(payload.totalPoint){
//     payload.totalPoint = Number(payload.totalPoint);
//   }

//   if(payload.userGroupTrack){
//     const isUserGroupTrackExist = await UserGroupTrack.exists({
//       _id: payload.userGroupTrack
//     });
//     if(!isUserGroupTrackExist){
//       throw new ApiError(StatusCodes.NOT_FOUND, "User Group Track Id not found!");
//     }
//   }
//   if(payload.userGroup){
//     const isUserGroupExist = await UserGroup.exists({_id: {$in: payload.userGroup}});
//     if(!isUserGroupExist){
//       throw new ApiError(StatusCodes.NOT_FOUND, "User Group Id not found!");
//     }
//   }
//   console.log('payload-',payload)
//   const result = await Assignment.findByIdAndUpdate(id, payload, { new: true });
//   if (!result) {
//     throw new ApiError(StatusCodes.NOT_FOUND, "Assignment doesn't exist!");
//   }
//   return  result ;
// };
const updateAssignmentToDB = async (id: string, payload: Partial<IAssignment>) => {

  if (payload.totalPoint !== undefined) {
    payload.totalPoint = Number(payload.totalPoint);
  }

  if (payload.userGroupTrack !== undefined) {
    if (payload.userGroupTrack) {
      const isUserGroupTrackExist = await UserGroupTrack.exists({
        _id: payload.userGroupTrack
      });
      if (!isUserGroupTrackExist) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User Group Track Id not found!");
      }
    } 

  }

  if (payload.userGroup !== undefined) {
    if (Array.isArray(payload.userGroup) && payload.userGroup.length > 0) {
      const isUserGroupExist = await UserGroup.exists({ _id: { $in: payload.userGroup } });
      if (!isUserGroupExist) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User Group Id not found!");
      }
    }
  }

  console.log('payload-', payload);
  const result = await Assignment.findByIdAndUpdate(id, payload, { new: true });
  
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Assignment doesn't exist!");
  }
  return result;
};

const deleteAssignmentFromDB = async (id: string) => {
  const result = await Assignment.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Assignment doesn't exist!");
  }
  return  result ;
};

const addmarksAndFeedbackToSubmission = async (
  submissionId: string,
  marks: number,
  feedback: string
) => {
  const submission = await AssignmentsSub.findById(submissionId);
  if (!submission) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Submission not found');
  }

  submission.marks = marks;
  submission.feedback = feedback;
  await submission.save();

  return submission;
};

export const AssignmentService = {
  createAssignmentToDB,
  getAllAssignmentsFromDB,
  getAssignmentByIdFromDB,
  updateAssignmentToDB,
  deleteAssignmentFromDB,
  addmarksAndFeedbackToSubmission
};
