import { StatusCodes } from "http-status-codes";
import ApiError from "../../../../errors/ApiError";
import { ILearningMaterial } from "./learning.interface";
import { LearningMaterial } from "./learning.model";
import QueryBuilder from "../../../../shared/apiFeature";
import { User } from "../../user/user.model";
import { sendNotifications } from "../../../../helpers/notificationsHelper";
import { socketHelper } from "../../../../helpers/socketHelper";
import { UserGroupTrack } from "../../user-group/user-group-track/user-group-track.model";
import mongoose from "mongoose";
const { Types } = mongoose;

const createResourceFromDB = async (payload: ILearningMaterial) => {
  const resource = await LearningMaterial.create(payload);
  const baseText = `new resource added ${resource.title}.`;

  const receiverFilter = resource.targertGroup
    ? { role: "STUDENT", userGroup: resource.targertGroup }
    : { role: resource.targeteAudience };

  const receivers = await User.find(receiverFilter).select("_id").lean();

  if (receivers.length) {
    await Promise.all(
      receivers.map((receiver) =>
        sendNotifications({
          text: baseText,
          receiver: receiver._id,
          type: resource.targeteAudience === "MENTOR" ? "MENTOR" : "STUDENT",
        }),
      ),
    );
  }

  const io = (
    socketHelper as {
      getIO?: () => { emit: (event: string, data: unknown) => void };
    }
  ).getIO?.();
  if (io) {
    io.emit("notification", {
      text: baseText,
      receiverCount: receivers.length,
      targetRole: resource.targertGroup ? "STUDENT" : resource.targeteAudience,
    });
  }

  return resource;
};

const getCreatedByResourcesFromDB = async (
  createdBy: string,
  query?: Record<string, any>,
) => {
  const safeQuery = query || {};

  const qb = new QueryBuilder(LearningMaterial.find({ createdBy }), safeQuery)
    .sort()
    .paginate();

  const resources = await qb.queryModel.populate("createdBy").exec();

  const pagination = await qb.getPaginationInfo();

  return { resources, pagination };
};

// const getResourceByIdFromDB = async (id: string) => {
//   const resource = await LearningMaterial.findById(id)
//     .populate("createdBy")
//     // .populate('targetGroup') // if applicable
//     .exec();

//   return resource;
// };

// const getAllMentorResourcesFromDB = async (
//   query?: Record<string, any>,
//   userId?: string,
// ) => {
//   const safeQuery = query || {};
//   const searchableFields = ["title", "description", "type", "contentUrl"];

//   if (safeQuery.targeteAudience === "STUDENT" && userId) {
//     const student = await User.findById(userId)
//       .select("userGroup")
//       .select("targetTrack")
//       .lean();
//     const studentGroupIds = student?.userGroup || [];
//     const studentTrackIds = student?.targetTrack || [];

//     const filterCondition = {
//       targeteAudience: "STUDENT",
//       $or: [
//         { targertGroup: { $in: studentGroupIds } },
//         { targertGroup: null },
//         { targertGroup: { $exists: false } },
//         { targetTrack: { $in: studentTrackIds } },
//       ],
//     };

//     delete safeQuery.targeteAudience;
//     const qb = new QueryBuilder(
//       LearningMaterial.find(filterCondition),
//       safeQuery,
//     )
//       .search(searchableFields)
//       .sort()
//       .paginate();

//     const resources = await qb.queryModel
//       .populate({
//         path: "createdBy",
//         select: "firstName lastName email profile contact location",
//       })
//       .populate({ path: "targertGroup", select: "name description" })
//       .populate({ path: "targetTrack", select: "name description" })
//       .exec();

//     const pagination = await qb.getPaginationInfo();
//     return { resources, pagination };
//   }

//   // ✅ FIX: convert targertGroup strings → ObjectId
//   console.log("safeQuery", safeQuery);
//   const test = await LearningMaterial.find({
//     targertGroup: { $in: safeQuery.targertGroup || [] },
//   });
//   console.log("test", test);

//   const qb = new QueryBuilder(LearningMaterial.find(), safeQuery)
//     .search(searchableFields)
//     .filter()
//     .sort()
//     .paginate();

//   const resources = await qb.queryModel
//     .populate({
//       path: "createdBy",
//       select: "firstName lastName email profile contact location",
//     })
//     .populate({ path: "targertGroup", select: "name description" })
//     .populate({ path: "targetTrack", select: "name description" })
//     .exec();

//   const pagination = await qb.getPaginationInfo();
//   return { resources, pagination };
// };
const getResourceByIdFromDB = async (id: string) => {
  const resource = await LearningMaterial.findById(id)
    .populate("createdBy")
    // .populate('targetGroup') // if applicable
    .exec();

  return resource;
};

const getAllMentorResourcesFromDB = async (
  query?: Record<string, any>,
  userId?: string,
) => {
  const safeQuery = query || {};
  
  const searchableFields = ["title", "description", "type", "contentUrl"];
  console.log("safeQuery--", safeQuery);

  if (safeQuery.targeteAudience === "STUDENT" && userId) {
    const student = await User.findById(userId)
      .select("userGroup")
      .select("targetTrack")
      .lean();
    const studentGroupIds = student?.userGroup || [];
    const studentTrackIds = student?.targetTrack || [];

    const filterCondition = {
      targeteAudience: "STUDENT",
      $or: [
        { targertGroup: { $in: studentGroupIds } },
        { targertGroup: null },
        { targertGroup: { $exists: false } },
        { targetTrack: { $in: studentTrackIds } },
      ],
    };

    delete safeQuery.targeteAudience;
    const qb = new QueryBuilder(
      LearningMaterial.find(filterCondition),
      safeQuery,
    )
      .search(searchableFields)
      .sort()
      .paginate();

    const resources = await qb.queryModel
      .populate({
        path: "createdBy",
        select: "firstName lastName email profile contact location",
      })
      .populate({ path: "targertGroup", select: "name description" })
      .populate({ path: "targetTrack", select: "name description" })
      .exec();

    const pagination = await qb.getPaginationInfo();
    return { resources, pagination };
  }

  // Handle targertGroup filter for general queries
  let baseFilter = {};
  if (safeQuery.targertGroup) {
    const groupIds = Array.isArray(safeQuery.targertGroup) 
      ? safeQuery.targertGroup 
      : [safeQuery.targertGroup];
    
    baseFilter = { targertGroup: { $in: groupIds.map(id => new Types.ObjectId(id)) } };
  }

  const qb = new QueryBuilder(LearningMaterial.find(baseFilter), safeQuery)
    .search(searchableFields)
    .filter(["targertGroup"])
    .sort()
    .paginate();

  const resources = await qb.queryModel
    .populate({
      path: "createdBy",
      select: "firstName lastName email profile contact location",
    })
    .populate({ path: "targertGroup", select: "name description" })
    .populate({ path: "targetTrack", select: "name description" })
    .exec();

  const pagination = await qb.getPaginationInfo();
  return { resources, pagination };
};
const getFilteredResourcesFromDB = async (query?: Record<string, any>) => {
  const safeQuery = query || {};
  const searchableFields = ["title", "type", "targetAudience", "targertGroup"];

  const qb = new QueryBuilder(LearningMaterial.find(), safeQuery)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate();

  const resources = await qb.queryModel
    .populate("targertGroup")
    .select("-createdBy")
    .exec();

  const pagination = await qb.getPaginationInfo();

  return { resources, pagination };
};

const updateResourceFromDB = async (id: string, payload: ILearningMaterial) => {
  const updatePayload: any = { ...payload };

  if (updatePayload.targertGroup) {
    const { Types } = await import("mongoose");
    if (Array.isArray(updatePayload.targertGroup)) {
      updatePayload.targertGroup = updatePayload.targertGroup.map(
        (id: string) => new Types.ObjectId(id),
      );
    } else {
      updatePayload.targertGroup = new Types.ObjectId(
        updatePayload.targertGroup,
      );
    }
  }

  const isTargetTrackExists = await UserGroupTrack.findById(
    updatePayload.targetTrack,
  ).lean();
  if (!isTargetTrackExists) {
    updatePayload.targetTrack = null;
  }

  const result = await LearningMaterial.findByIdAndUpdate(
    id,
    { $set: updatePayload },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Resource not found");
  }
  return result;
};

const deleteResourceFromDB = async (id: string) => {
  const cleanId = id.trim();
  const result = await LearningMaterial.findByIdAndDelete(cleanId);

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Resource not found");
  }
};



const getAllMentorResources = async (
  query?: Record<string, any>,
  userId?: string,
) => {
  const safeQuery = query || {};
  
  const searchableFields = ["title", "description", "type", "contentUrl"];

  // Handle targertGroup filter for general queries
  let baseFilter = {};
  if (safeQuery.targertGroup) {
    const groupIds = Array.isArray(safeQuery.targertGroup) 
      ? safeQuery.targertGroup 
      : [safeQuery.targertGroup];
    
    baseFilter = { targertGroup: { $in: groupIds.map(id => new Types.ObjectId(id)) } };
  }

  const qb = new QueryBuilder(LearningMaterial.find(baseFilter), safeQuery)
    .search(searchableFields)
    .filter(["targertGroup"])
    .sort()
    .paginate();

  const resources = await qb.queryModel
    .populate({
      path: "createdBy",
      select: "firstName lastName email profile contact location",
    })
    .populate({ path: "targertGroup", select: "name description" })
    .populate({ path: "targetTrack", select: "name description" })
    .exec();

  const pagination = await qb.getPaginationInfo();
  return { resources, pagination };
};
export const LearningMaterialService = {
  createResourceFromDB,
  getCreatedByResourcesFromDB,
  getResourceByIdFromDB,
  getAllMentorResourcesFromDB,
  updateResourceFromDB,
  deleteResourceFromDB,
  getFilteredResourcesFromDB,
  getAllMentorResources
};
