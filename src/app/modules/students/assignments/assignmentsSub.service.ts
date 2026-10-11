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

  const userObjectId = new Types.ObjectId(userId);
  const userGroupIds = user.userGroup && user.userGroup.length > 0
    ? user.userGroup.map((g: any) => g._id?.toString() || g.toString())
    : [];
  const userGroupObjectIds = userGroupIds.map((id) => new Types.ObjectId(id));

  const orConditions: any[] = [
    // 1. Directly assigned to student
    { studentAssigned: userObjectId },
    // 2. Open to all students
    {
      $and: [
        { $or: [{ studentAssigned: { $size: 0 } }, { studentAssigned: { $exists: false } }] },
        { $or: [{ userGroup: { $size: 0 } }, { userGroup: { $exists: false } }] },
      ],
    },
  ];

  // 3. User's group(s)
  if (userGroupObjectIds.length > 0) {
    orConditions.push({
      userGroup: { $in: userGroupObjectIds },
      $or: [
        { studentAssigned: { $size: 0 } },
        { studentAssigned: { $exists: false } },
        { studentAssigned: userObjectId },
      ],
    });
  }

  // 4. User's track
  if (user.userGroupTrack) {
    const trackId = user.userGroupTrack._id?.toString() || user.userGroupTrack.toString();
    orConditions.push({
      userGroupTrack: new Types.ObjectId(trackId),
      $or: [
        { studentAssigned: { $size: 0 } },
        { studentAssigned: { $exists: false } },
        { studentAssigned: userObjectId },
      ],
    });
  }

  assignmentQuery.$or = orConditions;

  // If specific userGroup is queried, match if assignment belongs to that group OR directly assigned to student
  if (query.userGroup && Types.ObjectId.isValid(query.userGroup as string)) {
    const reqGroupId = new Types.ObjectId(query.userGroup as string);
    assignmentQuery.$and = [
      { $or: orConditions },
      {
        $or: [
          { userGroup: reqGroupId },
          { studentAssigned: userObjectId },
        ],
      },
    ];
    delete assignmentQuery.$or;
  }

  const result = await Assignment.find(assignmentQuery)
    .populate('teacher', 'firstName lastName profile')
    .populate('userGroup userGroupTrack')
    .populate('studentAssigned', 'firstName lastName email profile')
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
  getMyAssignmentsFromDB,
  getupcomigEventsFromDB,
  getAllsubmitedAssignmentsFromDB,

};