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

const createClassToDB = async (payload: IClass) => {

  const result = await Class.create(payload);

  console.log('Created Class teacher field:', result.teacher);

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
const getAllClassesFromDB = async (query: Record<string, any>) => {
  
  const queryData = { ...query };
  const filterConditions: Record<string, any> = {};
  const searchTerm = typeof queryData.searchTerm === 'string' ? queryData.searchTerm.trim() : '';

  const page = Math.max(Number(queryData.page) || 1, 1);
  const parsedLimit = Number(queryData.limit);
  const limit = queryData.limit !== undefined && parsedLimit === 0 ? 0 : parsedLimit || 10;

  // Handle date-wise filtering using Day.js
  const today = dayjs().startOf('day'); // Start of today
  const todayDate = today.toDate(); // Convert to Date for MongoDB

  if (queryData.filterType) {
    if (queryData.filterType === 'upcoming') {
      // Show classes from today onwards (today, tomorrow, future dates)
      filterConditions.classDate = { $gte: todayDate };
      queryData.sort = 'classDate'; // Show in chronological order (today first, then future)
    } else if (queryData.filterType === 'completed') {
      // Show classes with dates before today in serial order
      filterConditions.classDate = { $lt: todayDate };
      queryData.sort = '-classDate'; // Show in reverse chronological order (most recent first)
    }
    delete queryData.filterType;
  }

  // if (!queryData.sort) {
  //   queryData.sort = '-classDate'; 
  // }

  delete queryData.searchTerm;

  if (queryData.userGroup) {
    const userGroupValues = Array.isArray(queryData.userGroup)
      ? queryData.userGroup
      : String(queryData.userGroup).split(',').map((value) => value.trim()).filter(Boolean);

    const validUserGroupIds = userGroupValues.filter((id) => Types.ObjectId.isValid(id));
    if (!validUserGroupIds.length) {
      return { pagination: { total: 0, totalPage: 1, page, limit }, classes: [] };
    }
    filterConditions.userGroup = { $in: validUserGroupIds.map((id) => new Types.ObjectId(id)) };
  }

  if (queryData.userGroupTrack) {
    const userGroupTrackId = String(queryData.userGroupTrack).trim();
    if (!Types.ObjectId.isValid(userGroupTrackId)) {
      return { pagination: { total: 0, totalPage: 1, page, limit }, classes: [] };
    }
    filterConditions.userGroupTrack = new Types.ObjectId(userGroupTrackId);
  }

  delete queryData.userGroup;
  delete queryData.userGroupTrack;

  const baseQuery = Class.find(filterConditions);

  // Debug: Check what classes exist and their dates
  const allClasses = await Class.find({}).select('title classDate').lean();
  console.log('All classes in DB:', allClasses.map(c => ({ 
    title: c.title, 
    classDate: c.classDate,
    classDateDayjs: dayjs(c.classDate).format('YYYY-MM-DD'),
    isTodayOrFuture: dayjs(c.classDate).isAfter(today) || dayjs(c.classDate).isSame(today),
    isBeforeToday: dayjs(c.classDate).isBefore(today)
  })));

  console.log('Filter conditions being applied:', filterConditions);
  console.log('Query data after processing:', queryData);

  const result = new QueryBuilder(baseQuery, queryData)
    .filter()
    .sort()
    .paginate();

  if (searchTerm) {
    const searchConditions: Record<string, any>[] = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { location: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
    ];

    const [matchedGroups, matchedTracks] = await Promise.all([
      UserGroup.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
      UserGroupTrack.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
    ]);

    const matchedGroupIds = matchedGroups.map((group) => group._id);
    const matchedTrackIds = matchedTracks.map((track) => track._id);

    if (matchedGroupIds.length) searchConditions.push({ userGroup: { $in: matchedGroupIds } });
    if (matchedTrackIds.length) searchConditions.push({ userGroupTrack: { $in: matchedTrackIds } });

    const existingQuery = result.queryModel.getQuery();
    result.queryModel = result.queryModel.find({
      $and: [existingQuery, { $or: searchConditions }],
    });
  }

  const classes = await result.queryModel
    .select('file title description classDate location virtualClass status published userGroup userGroupTrack studentId teacher slideUrl')
    .populate({ path: 'userGroup', select: 'name' })
    .populate({ path: 'userGroupTrack', select: 'name' })
    .populate({ path: 'studentId', select: 'firstName lastName email profile', model: 'User' })
    .populate({ path: 'teacher', select: 'firstName lastName email profile', model: 'User' });

  const pagination = await result.getPaginationInfo();
  return { classes, pagination };
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
