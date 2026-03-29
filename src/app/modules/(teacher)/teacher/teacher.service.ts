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

const getAllMyStudent = async ( user: JwtPayload, query: Record<string, any>) => {
  const queryData = { ...query };
  const searchTerm = typeof queryData.searchTerm === 'string' ? queryData.searchTerm.trim() : '';
  delete queryData.searchTerm;

  const teacher = (await User.findById(user.id, "userGroup userGroupTrack").lean().populate("userGroup")) as IUser & {
    userGroup: IUserGroup[] | null;
    userGroupTrack: any;
  };
  
  const groupIds = teacher.userGroup?.map((group: { _id: any }) => group._id) || [];
  const trackId = teacher.userGroupTrack;

  const getAllStudent = new QueryBuilder(
    User.find({
      role: USER_ROLES.STUDENT,
      $or: [{ userGroup: { $in: groupIds } }, { userGroupTrack: trackId }],
    }),queryData)
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
