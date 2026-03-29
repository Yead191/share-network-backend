import { StatusCodes } from "http-status-codes";
import ApiError from "../../../../errors/ApiError";
import QueryBuilder from "../../../../shared/apiFeature";
import { IClass } from "./class.interface";
import { Class } from "./class.model";
import { User } from "../../user/user.model";
import { Types } from "mongoose";
import { RecentActivity } from "../recentActivities/recentActivity.model";

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
const getAllClassesFromDB = async (query: Record<string, any>) => {
  let filterConditions: Record<string, any> = {};

  if (query.userGroup) {
    const userGroupIds = Array.isArray(query.userGroup)
      ? query.userGroup
      : [query.userGroup];
    filterConditions['userGroup'] = { $in: userGroupIds };
  }

  if (query.userGroupTrack) {
    filterConditions['userGroupTrack'] = query.userGroupTrack;
  }

  const baseQuery = Class.find(filterConditions);

  const result = new QueryBuilder(baseQuery, query)
    .search(['title', 'location', 'description'])
    .filter()
    .sort()
    .paginate();

  const classes = await result.queryModel
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
    });

  const pagination = await result.getPaginationInfo();
  return { classes, pagination };
};

const getClassByIdFromDB = async (id: string) => {
  const result = await Class.findById(id)
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
