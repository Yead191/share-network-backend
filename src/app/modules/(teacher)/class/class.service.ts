import { StatusCodes } from "http-status-codes";
import ApiError from "../../../../errors/ApiError";
import QueryBuilder from "../../../../shared/apiFeature";
import { IClass } from "./class.interface";
import { Class } from "./class.model";
import { Types } from "mongoose";
import { RecentActivity } from "../recentActivities/recentActivity.model";
import { UserGroup } from "../../user-group/user-group.model";
import { UserGroupTrack } from "../../user-group/user-group-track/user-group-track.model";
import dayjs from "dayjs";
import { JwtPayload } from "jsonwebtoken";
import { USER_ROLES } from "../../../../enums/user";

const createClassToDB = async (payload: IClass) => {

  const result = await Class.create(payload);

  // console.log('Created Class teacher field:', result.teacher);

  await RecentActivity.create({
    title: result.title,
    description: result.description,
    type: 'CLASS',
    user: result.teacher,
    referenceId: result._id,
  });


  const populated = await Class.findById(result._id)
    .select('file title description classDate location virtualClass status published userGroup userGroupTrack studentId teacher')
    .populate({
      path: 'teacher',
      select: 'firstName lastName email profile',
      model: 'User',
    })
    .populate({
      path: 'userGroup',
      select: 'name',
    })
    .populate({
      path: 'userGroupTrack',
      select: 'name',
    });

  return populated;
};
// const getAllClassesFromDB = async (query: Record<string, any>) => {
//   const queryData = { ...query };
//   const filterConditions: Record<string, any> = {};
//   const searchTerm = typeof queryData.searchTerm === 'string' ? queryData.searchTerm.trim() : '';

//   const page = Math.max(Number(queryData.page) || 1, 1);
//   const parsedLimit = Number(queryData.limit);
//   const limit = queryData.limit !== undefined && parsedLimit === 0 ? 0 : parsedLimit || 10;

//   delete queryData.searchTerm;

//   if (queryData.userGroup) {
//     const userGroupValues = Array.isArray(queryData.userGroup)
//       ? queryData.userGroup
//       : String(queryData.userGroup).split(',').map((value) => value.trim()).filter(Boolean);

//     const validUserGroupIds = userGroupValues.filter((id) => Types.ObjectId.isValid(id));

//     if (!validUserGroupIds.length) {
//       return { pagination: { total: 0, totalPage: 1, page, limit }, classes: [] };
//     }

//     filterConditions.userGroup = { $in: validUserGroupIds.map((id) => new Types.ObjectId(id)) };
//   }

//   if (queryData.userGroupTrack) {
//     const userGroupTrackId = String(queryData.userGroupTrack).trim();
//     if (!Types.ObjectId.isValid(userGroupTrackId)) {
//       return { pagination: { total: 0, totalPage: 1, page, limit }, classes: [] };
//     }

//     filterConditions.userGroupTrack = new Types.ObjectId(userGroupTrackId);
//   }

//   delete queryData.userGroup;
//   delete queryData.userGroupTrack;

//   const baseQuery = Class.find(filterConditions);

//   const result = new QueryBuilder(baseQuery, queryData)
//     .filter()
//     .sort()
//     .paginate();

//   if (searchTerm) {
//     const searchConditions: Record<string, any>[] = [
//       { title: { $regex: searchTerm, $options: 'i' } },
//       { location: { $regex: searchTerm, $options: 'i' } },
//       { description: { $regex: searchTerm, $options: 'i' } },
//     ];

//     const [matchedGroups, matchedTracks] = await Promise.all([
//       UserGroup.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
//       UserGroupTrack.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
//     ]);

//     const matchedGroupIds = matchedGroups.map((group) => group._id);
//     const matchedTrackIds = matchedTracks.map((track) => track._id);

//     if (matchedGroupIds.length) {
//       searchConditions.push({ userGroup: { $in: matchedGroupIds } });
//     }

//     if (matchedTrackIds.length) {
//       searchConditions.push({ userGroupTrack: { $in: matchedTrackIds } });
//     }

//     const existingQuery = result.queryModel.getQuery();
//     result.queryModel = result.queryModel.find({
//       $and: [existingQuery, { $or: searchConditions }],
//     });
//   }

//   const classes = await result.queryModel
//     .populate({
//       path: 'userGroup',
//       select: 'name',
//     })
//     .populate({
//       path: 'userGroupTrack',
//       select: 'name',
//     })
//     .populate({
//       path: 'studentId',
//       select: 'firstName lastName email profile',
//       model: 'User',
//     })
//     .populate({
//       path: 'teacher',
//       select: 'firstName lastName email profile',
//       model: 'User',
//     });

//   const pagination = await result.getPaginationInfo();
//   return { classes, pagination };
// };
// const getAllClassesFromDB = async (query: Record<string, any>) => {
//   const queryData = { ...query };
//   const filterConditions: Record<string, any> = {};
//   const searchTerm = typeof queryData.searchTerm === 'string' ? queryData.searchTerm.trim() : '';

//   const page = Math.max(Number(queryData.page) || 1, 1);
//   const parsedLimit = Number(queryData.limit);
//   const limit = queryData.limit !== undefined && parsedLimit === 0 ? 0 : parsedLimit || 10;

//   if (!queryData.sort) {
//     queryData.sort = '-classDate'; 
//   }

//   delete queryData.searchTerm;

//   if (queryData.userGroup) {
//     const userGroupValues = Array.isArray(queryData.userGroup)
//       ? queryData.userGroup
//       : String(queryData.userGroup).split(',').map((value) => value.trim()).filter(Boolean);

//     const validUserGroupIds = userGroupValues.filter((id) => Types.ObjectId.isValid(id));
//     if (!validUserGroupIds.length) {
//       return { pagination: { total: 0, totalPage: 1, page, limit }, classes: [] };
//     }
//     filterConditions.userGroup = { $in: validUserGroupIds.map((id) => new Types.ObjectId(id)) };
//   }

//   if (queryData.userGroupTrack) {
//     const userGroupTrackId = String(queryData.userGroupTrack).trim();
//     if (!Types.ObjectId.isValid(userGroupTrackId)) {
//       return { pagination: { total: 0, totalPage: 1, page, limit }, classes: [] };
//     }
//     filterConditions.userGroupTrack = new Types.ObjectId(userGroupTrackId);
//   }

//   delete queryData.userGroup;
//   delete queryData.userGroupTrack;

//   const baseQuery = Class.find(filterConditions);

//   const result = new QueryBuilder(baseQuery, queryData)
//     .filter()
//     .sort()
//     .paginate();

//   if (searchTerm) {
//     const searchConditions: Record<string, any>[] = [
//       { title: { $regex: searchTerm, $options: 'i' } },
//       { location: { $regex: searchTerm, $options: 'i' } },
//       { description: { $regex: searchTerm, $options: 'i' } },
//     ];

//     const [matchedGroups, matchedTracks] = await Promise.all([
//       UserGroup.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
//       UserGroupTrack.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
//     ]);

//     const matchedGroupIds = matchedGroups.map((group) => group._id);
//     const matchedTrackIds = matchedTracks.map((track) => track._id);

//     if (matchedGroupIds.length) searchConditions.push({ userGroup: { $in: matchedGroupIds } });
//     if (matchedTrackIds.length) searchConditions.push({ userGroupTrack: { $in: matchedTrackIds } });

//     const existingQuery = result.queryModel.getQuery();
//     result.queryModel = result.queryModel.find({
//       $and: [existingQuery, { $or: searchConditions }],
//     });
//   }

//   const classes = await result.queryModel
//     .populate({ path: 'userGroup', select: 'name' })
//     .populate({ path: 'userGroupTrack', select: 'name' })
//     .populate({ path: 'studentId', select: 'firstName lastName email profile', model: 'User' })
//     .populate({ path: 'teacher', select: 'firstName lastName email profile', model: 'User' });

//   const pagination = await result.getPaginationInfo();
//   return { classes, pagination };
// };
const getAllClassesFromDB = async (
  query: Record<string, any>,
  user: JwtPayload,
) => {
  const queryData = { ...query };

  const page = Math.max(Number(queryData.page) || 1, 1);
  const parsedLimit = Number(queryData.limit);
  const limit =
    queryData.limit !== undefined && parsedLimit === 0
      ? 0
      : parsedLimit || 10;

  const searchTerm =
    typeof queryData.searchTerm === 'string'
      ? queryData.searchTerm.trim()
      : '';

  const filterType = queryData.filterType;

  const today = dayjs().startOf('day').toDate();

  const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
  const currentYearEnd = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

  const filterConditions: Record<string, any> = {};

  // -----------------------------
  // Date Filters
  // -----------------------------
  if (filterType === 'upcoming') {
    filterConditions.classDate = {
      $gte: today,
    };

    queryData.sort ||= 'classDate';
  }

  if (filterType === 'completed') {
    filterConditions.classDate = {
      $lt: today,
    };

    queryData.sort ||= '-classDate';
  }

  // -----------------------------
  // User Group Filter
  // -----------------------------
  if (queryData.userGroup) {
    const groupIds = (
      Array.isArray(queryData.userGroup)
        ? queryData.userGroup
        : String(queryData.userGroup).split(',')
    )
      .map((id: string) => id.trim())
      .filter((id: string) => Types.ObjectId.isValid(id));

    if (!groupIds.length) {
      return {
        classes: [],
        pagination: {
          total: 0,
          totalPage: 1,
          page,
          limit,
        },
      };
    }

    filterConditions.userGroup = {
      $in: groupIds.map((id: string) => new Types.ObjectId(id)),
    };
  }

  // -----------------------------
  // Track Filter
  // -----------------------------
  if (queryData.userGroupTrack) {
    const trackId = String(queryData.userGroupTrack).trim();

    if (!Types.ObjectId.isValid(trackId)) {
      return {
        classes: [],
        pagination: {
          total: 0,
          totalPage: 1,
          page,
          limit,
        },
      };
    }

    filterConditions.userGroupTrack = new Types.ObjectId(trackId);
  }

  // -----------------------------
  // Non-admin restrictions
  // -----------------------------
  if (
    user?.role !== USER_ROLES.SUPER_ADMIN &&
    filterType !== 'upcoming'
  ) {
    filterConditions.status = true;

    if (!filterConditions.classDate) {
      filterConditions.classDate = {};
    }

    filterConditions.classDate = {
      ...filterConditions.classDate,
      $gte: currentYearStart,
      $lte: currentYearEnd,
    };
  }

  // Remove custom params
  delete queryData.searchTerm;
  delete queryData.filterType;
  delete queryData.userGroup;
  delete queryData.userGroupTrack;

  // -----------------------------
  // Base Query
  // -----------------------------
  const baseQuery = Class.find(filterConditions);

  const result = new QueryBuilder(baseQuery, queryData)
    .filter()
    .sort()
    .paginate();

  // -----------------------------
  // Search
  // -----------------------------
  if (searchTerm) {
    const [matchedGroups, matchedTracks] = await Promise.all([
      UserGroup.find({
        name: { $regex: searchTerm, $options: 'i' },
      })
        .select('_id')
        .lean(),

      UserGroupTrack.find({
        name: { $regex: searchTerm, $options: 'i' },
      })
        .select('_id')
        .lean(),
    ]);

    const searchConditions: Record<string, any>[] = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { location: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
    ];

    if (matchedGroups.length) {
      searchConditions.push({
        userGroup: {
          $in: matchedGroups.map((g) => g._id),
        },
      });
    }

    if (matchedTracks.length) {
      searchConditions.push({
        userGroupTrack: {
          $in: matchedTracks.map((t) => t._id),
        },
      });
    }

    result.queryModel = result.queryModel.find({
      $or: searchConditions,
    });
  }

  const classes = await result.queryModel
    .select(
      'file title description classDate location virtualClass status published userGroup userGroupTrack studentId teacher slideUrl',
    )
    .populate({
      path: 'userGroup',
      select: 'name',
    })
    .populate({
      path: 'userGroupTrack',
      select: 'name',
    })
    .populate({
      path: 'studentId',
      select: 'firstName lastName email profile',
      model: 'User',
    })
    .populate({
      path: 'teacher',
      select: 'firstName lastName email profile',
      model: 'User',
    })
    .lean();

  const pagination = await result.getPaginationInfo();

  return {
    classes,
    pagination,
  };
};
const getClassByIdFromDB = async (id: string) => {
  const result = await Class.findById(id)
    .select('file title description classDate location virtualClass status published userGroup userGroupTrack studentId teacher slideUrl')
    .populate("userGroup")
    .populate("userGroupTrack");
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Class doesn't exist!");
  }
  return result;
};

const updateClassToDB = async (id: string, payload: Partial<IClass>) => {
  const result = await Class.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Class doesn't exist!");
  }
  const message = "Class Updated successfully";
  return { message, result };
};

const deleteClassFromDB = async (id: string) => {
  const result = await Class.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Class doesn't exist!");
  }
  const message = "Class Deleted successfully";
  return { message, result };
};

export const ClassService = {
  createClassToDB,
  getAllClassesFromDB,
  getClassByIdFromDB,
  updateClassToDB,
  deleteClassFromDB,
};
