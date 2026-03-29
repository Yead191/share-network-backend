import { StatusCodes } from "http-status-codes";
import ApiError from "../../../../errors/ApiError";
import { ILearningMaterial } from "./learning.interface";
import { LearningMaterial } from "./learning.model";
import { query } from 'express';
import QueryBuilder from "../../../../shared/apiFeature";
import { User } from "../../user/user.model";
import path from 'path';
import { sendNotifications } from "../../../../helpers/notificationsHelper";
import { socketHelper } from "../../../../helpers/socketHelper";


const createResourceFromDB = async (payload: ILearningMaterial) => {
    const resource  = await LearningMaterial.create(payload);
    const notificationData = {
        text: `new resource added ${resource.title}.`,
        receiver: resource.targertGroup ? resource.targertGroup : resource.targeteAudience,
        sender: resource.createdBy,
        type: "STUDENT",
        targetRole: resource.targertGroup ? "STUDENT" : resource.targeteAudience,
    };
  const io = (socketHelper as { getIO?: () => { emit: (event: string, data: unknown) => void } }).getIO?.();
  if (io) {
      io.emit("notification", notificationData);
  }
  sendNotifications(notificationData);
  return resource;
}


const getCreatedByResourcesFromDB = async (createdBy: string, query?: Record<string, any>) => {
  const safeQuery = query || {};

  const qb = new QueryBuilder(LearningMaterial.find({ createdBy }), safeQuery)
    .sort()
    .paginate();

  const resources = await qb.queryModel
    .populate('createdBy')
    .exec();

  const pagination = await qb.getPaginationInfo();

  return { resources, pagination };
};

const getResourceByIdFromDB = async (id: string) => {
  const resource = await LearningMaterial.findById(id)
    .populate('createdBy')
    // .populate('targetGroup') // if applicable
    .exec();

  return resource;
};


const getAllMentorResourcesFromDB = async (query?: Record<string, any>, userId?: string) => {
  const safeQuery = query || {};
  const searchableFields = ['title', 'description', 'type', 'contentUrl',];

  if (safeQuery.targeteAudience === 'STUDENT' && userId) {
    const student = await User.findById(userId).select('userGroup').lean();
    const studentGroupIds = student?.userGroup || [];

   
    const filterCondition = {
      targeteAudience: 'STUDENT',
      $or: [
        { targertGroup: { $in: studentGroupIds } },
        { targertGroup: null },
        { targertGroup: { $exists: false } },
      ],
    };

    delete safeQuery.targeteAudience; 
    const qb = new QueryBuilder(LearningMaterial.find(filterCondition), safeQuery)
      .search(searchableFields)
      .sort()
      .paginate();

    const resources = await qb.queryModel
      .populate({ path: 'createdBy', select: 'firstName lastName email profile contact location' })
      .populate({ path: 'targertGroup', select: 'name description' })
      .exec();

    const pagination = await qb.getPaginationInfo();
    return { resources, pagination };
  }


  const qb = new QueryBuilder(LearningMaterial.find(), safeQuery)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate();

  const resources = await qb.queryModel
    .populate({ path: 'createdBy', select: 'firstName lastName email profile contact location' })
    .populate({ path: 'targertGroup', select: 'name description' })
    .exec();

  const pagination = await qb.getPaginationInfo();
  return { resources, pagination };
};

const getFilteredResourcesFromDB = async (query?: Record<string, any>) => {
  const safeQuery = query || {};
  const searchableFields = ['title', 'type', 'targetAudience', 'targertGroup'];

  const qb = new QueryBuilder(LearningMaterial.find(), safeQuery)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate();

  const resources = await qb.queryModel
    .populate('targertGroup') 
    .select('-createdBy')
    .exec();

  const pagination = await qb.getPaginationInfo();

  return { resources, pagination };
};

const updateResourceFromDB = async (id: string, payload: ILearningMaterial) => {
    const updatePayload: any = { ...payload };
    
    if (updatePayload.targertGroup) {
        const { Types } = await import('mongoose');
        updatePayload.targertGroup = new Types.ObjectId(updatePayload.targertGroup);
    }

    const result = await LearningMaterial.findByIdAndUpdate(
        id, 
        { $set: updatePayload },  
        {
            new: true, 
            runValidators: true
        }
    );

    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Resource not found');
    }
    return result;
};

const deleteResourceFromDB = async (id: string) => {
    const cleanId = id.trim();
    const result = await LearningMaterial.findByIdAndDelete(cleanId);

    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Resource not found');
    }
}

export const LearningMaterialService = {
    createResourceFromDB,
    getCreatedByResourcesFromDB,
    getResourceByIdFromDB,
    getAllMentorResourcesFromDB,
    updateResourceFromDB,
    deleteResourceFromDB,
    getFilteredResourcesFromDB
};