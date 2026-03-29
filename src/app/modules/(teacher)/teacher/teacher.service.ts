import { JwtPayload } from "jsonwebtoken";
import QueryBuilder from "../../../../shared/apiFeature";
import { User } from "../../user/user.model";
import { IUser } from "../../user/user.interface";
import { IUserGroup } from "../../user-group/user-group.interface";
import { UserGroup } from "../../user-group/user-group.model";
import { UserGroupTrack } from "../../user-group/user-group-track/user-group-track.model";
import { USER_ROLES } from "../../../../enums/user";
import { Assignment } from "../assignment/assignment.model";
import { Class } from "../class/class.model";
import ApiError from "../../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

const getAllMyStudent = async ( user: JwtPayload, query: Record<string, any>) => {
  const queryData = { ...query };
  const searchTerm = typeof queryData.searchTerm === 'string' ? queryData.searchTerm.trim() : '';
  delete queryData.searchTerm;

  const requestedUserGroup = typeof queryData.userGroup === 'string' ? queryData.userGroup.trim() : '';
  const requestedUserGroupTrack = typeof queryData.userGroupTrack === 'string' ? queryData.userGroupTrack.trim() : '';

  delete queryData.userGroup;
  delete queryData.userGroupTrack;

  const teacher = (await User.findById(user.id, "userGroup userGroupTrack").lean().populate("userGroup")) as IUser & {
    userGroup: IUserGroup[] | null;
    userGroupTrack: any;
  };

  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Teacher not found");
  }
  
  const groupIds = teacher.userGroup?.map((group: { _id: any }) => group._id) || [];
  const trackId = teacher.userGroupTrack;

  const page = Math.max(Number(queryData.page) || 1, 1);
  const parsedLimit = Number(queryData.limit);
  const limit = queryData.limit !== undefined && parsedLimit === 0 ? 0 : parsedLimit || 10;

  if (requestedUserGroup && !Types.ObjectId.isValid(requestedUserGroup)) {
    return {
      pagination: { total: 0, totalPage: 1, page, limit },
      student: [],
    };
  }

  if (requestedUserGroupTrack && !Types.ObjectId.isValid(requestedUserGroupTrack)) {
    return {
      pagination: { total: 0, totalPage: 1, page, limit },
      student: [],
    };
  }

  if (requestedUserGroup && !groupIds.some((groupId: any) => groupId?.toString() === requestedUserGroup)) {
    return {
      pagination: { total: 0, totalPage: 1, page, limit },
      student: [],
    };
  }

  if (requestedUserGroupTrack && trackId?.toString() !== requestedUserGroupTrack) {
    return {
      pagination: { total: 0, totalPage: 1, page, limit },
      student: [],
    };
  }

  const studentQuery: Record<string, any> = {
    role: USER_ROLES.STUDENT,
    $or: [{ userGroup: { $in: groupIds } }, { userGroupTrack: trackId }],
  };

  if (requestedUserGroup) {
    studentQuery.userGroup = new Types.ObjectId(requestedUserGroup);
  }

  if (requestedUserGroupTrack) {
    studentQuery.userGroupTrack = new Types.ObjectId(requestedUserGroupTrack);
  }

  const getAllStudent = new QueryBuilder(
    User.find(studentQuery),queryData)
    .filter()

    .paginate()

  if (searchTerm) {
    const searchConditions: Record<string, any>[] = [
      { firstName: { $regex: searchTerm, $options: 'i' } },
      { lastName: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
    ];

    const [matchedGroups, matchedTracks] = await Promise.all([
      UserGroup.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
      UserGroupTrack.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
    ]);

    const matchedGroupIds = matchedGroups.map((group) => group._id);
    const matchedTrackIds = matchedTracks.map((track) => track._id);

    if (matchedGroupIds.length) {
      searchConditions.push({ userGroup: { $in: matchedGroupIds } });
    }

    if (matchedTrackIds.length) {
      searchConditions.push({ userGroupTrack: { $in: matchedTrackIds } });
    }

    const existingQuery = getAllStudent.queryModel.getQuery();
    getAllStudent.queryModel = getAllStudent.queryModel.find({
      $and: [existingQuery, { $or: searchConditions }],
    });
  }

  const student = await getAllStudent.queryModel
    .populate({ path: "userGroup", select: "name" })
    .populate({ path: "userGroupTrack", select: "name" });
  const pagination = await getAllStudent.getPaginationInfo();

  return {
    pagination,
    student,
  };
};

const getOverview = async (user: JwtPayload) => {
  const teacher = (await User.findById(user.id, "userGroup userGroupTrack").lean().populate("userGroup")) as IUser & {
    userGroup: IUserGroup[] | null;
    userGroupTrack: any;
  };

  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Teacher not found");
  }

  const groupIds = teacher.userGroup?.map((group: { _id: any }) => group._id) || [];
  const trackId = teacher.userGroupTrack;

  const totalStudent = await User.countDocuments({
    role: USER_ROLES.STUDENT,
    $or: [{ userGroup: { $in: groupIds } }, { userGroupTrack: trackId }],
  });

  const totalClass = await Class.countDocuments({
    $or: [{ teacher: user.id }, { userGroup: { $in: groupIds } }, { userGroupTrack: trackId }],
  });

  const totalAssignment = await Assignment.countDocuments({
    $or: [{ teacher: user.id }, { userGroup: { $in: groupIds } }, { userGroupTrack: trackId }],
  });

  return {
    group: teacher.userGroup?.map((g:any) => g.name),
    totalStudent,
    totalClass,
    totalAssignment,
  };
};


export const TeacherService = {
  getAllMyStudent,
  getOverview,
};
