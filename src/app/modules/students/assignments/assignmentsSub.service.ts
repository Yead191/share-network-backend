import { StatusCodes } from 'http-status-codes';
import { Assignment } from '../../(teacher)/assignment/assignment.model';
import ApiError from '../../../../errors/ApiError';
import { UserGroupTrack } from '../../user-group/user-group-track/user-group-track.model';
import { UserGroup } from '../../user-group/user-group.model';
import { User } from '../../user/user.model';
import { Event } from '../../admin/event/event.model';
import { IAssignmentsSub } from './assignmentsSub.interface';
import { AssignmentsSub } from './assignmentsSub.model';
import QueryBuilder from '../../../../shared/apiFeature';
import mongoose, { Types } from 'mongoose';


const submitAssignmentIntoDB = async (payload: IAssignmentsSub) => {

  const assignment = await Assignment.findById(payload.assignmentId);
  if (!assignment) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Assignment not found');
  }

  const existingSubmission = await AssignmentsSub.findOne({
    assignmentId: payload.assignmentId,
    studentId: payload.studentId
  });

  if (existingSubmission) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You have already submitted this assignment');
  }

  const result = await AssignmentsSub.create({
    ...payload,
    status: 'COMPLETED' 
  });

  return result;
};

const getSubmissionsForTeacherFromDB = async (assignmentId: string) => {
  const result = await AssignmentsSub.find({ assignmentId })
    .populate('studentId')
    .populate('assignmentId');
  return result;
};

const getStudentOwnSubmissionsFromDB = async (studentId: string) => {
  const result = await AssignmentsSub.find({ studentId })
    .populate('assignmentId');
  return result;
};

const getMyAssignmentsFromDB = async (userId: string, query: Record<string, unknown> = {}) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!');
    }

    const assignmentQuery: any = { published: true };

    const requestedUserGroup = query.userGroup;
    let requestedUserGroupIds: string[] = [];

    if (requestedUserGroup) {
      const rawGroupIds = Array.isArray(requestedUserGroup)
        ? requestedUserGroup
        : String(requestedUserGroup)
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);

      requestedUserGroupIds = rawGroupIds
        .map((id) => String(id))
        .filter((id) => Types.ObjectId.isValid(id));

      if (!requestedUserGroupIds.length) {
        return [];
      }
    }

    const userGroupIds = user.userGroup && user.userGroup.length > 0
      ? user.userGroup.map((g: any) => g._id?.toString() || g.toString())
      : [];

    if (requestedUserGroupIds.length) {
      const userGroupSet = new Set(userGroupIds);
      const effectiveUserGroupIds = requestedUserGroupIds.filter((id) => userGroupSet.has(id));

      if (!effectiveUserGroupIds.length) {
        return [];
      }

      assignmentQuery.userGroup = { $in: effectiveUserGroupIds };
    } else {
      const orConditions: any[] = [];

      if (user.userGroupTrack) {
        const trackId = user.userGroupTrack._id?.toString() || user.userGroupTrack.toString();
        orConditions.push({ userGroupTrack: trackId });
      }

      if (userGroupIds.length > 0) {
        orConditions.push({ userGroup: { $in: userGroupIds } });
      }

      if (orConditions.length > 0) {
        assignmentQuery.$or = orConditions;
      }
    }

    const result = await Assignment.find(assignmentQuery)
        .populate('teacher', 'firstName lastName profile')
        .populate('userGroup userGroupTrack')
        .populate({
            path: 'submitAssignment',
            match: { studentId: userId },
        })
        .sort({ createdAt: -1 });

    return result;
};


const getupcomigEventsFromDB = async () => {
  const currentDate = new Date();
 const result = await Event.find({ date: { $gte: currentDate } })
    .sort({ date: 1 });

  return result;
}
const getAllsubmitedAssignmentsFromDB = async (
  teacherId: string,
  query: Record<string, unknown>
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  let assignmentIds: Types.ObjectId[] = [];

  if (query.assignmentId) {
    if (!Types.ObjectId.isValid(query.assignmentId as string)) {
      throw new Error('Invalid assignmentId');
    }
    assignmentIds = [new Types.ObjectId(query.assignmentId as string)];
  } else {
    const teacherAssignments = await Assignment.find({
      teacher: new Types.ObjectId(teacherId),
    }).select('_id');
    assignmentIds = teacherAssignments.map((a) => new Types.ObjectId(a._id.toString()));
  }

  const total = await AssignmentsSub.countDocuments({
    assignmentId: { $in: assignmentIds },
  });

  const result = await AssignmentsSub.find({
    assignmentId: { $in: assignmentIds },
  })
    .populate('assignmentId', 'title description dueDate totalPoint status attachment')
    .populate('studentId', 'name email role')
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    meta: {
      total,
      totalPage: Math.ceil(total / limit),
      page,
      limit,
    },
    data: result,
  };
};



export const AssignmentsSubService = {
  submitAssignmentIntoDB,
  getSubmissionsForTeacherFromDB,
  getStudentOwnSubmissionsFromDB,
  getMyAssignmentsFromDB ,
  getupcomigEventsFromDB,
  getAllsubmitedAssignmentsFromDB,

};