import catchAsync from "../../../../shared/catchAsync";
import { LearningMaterialService } from "./learning.service";
import { Types } from "mongoose";

const createResource = catchAsync(async (req, res) => {
  const result = req.body;
  result.createdBy = req.user.id;

  if (result.targertGroup) {
    result.targertGroup = new Types.ObjectId(result.targertGroup);
  }

  console.log("targertGroup ID being saved:", result.targertGroup);
  console.log("Type:", typeof result.targertGroup);
  if (req.files && (req.files as any)["file"]?.[0]) {
    result.pdf = `/files/${(req.files as any)["file"][0].filename}`;
  }

  console.log("PAYLOAD:", result);

  const newResource = await LearningMaterialService.createResourceFromDB(result);

  res.status(201).json({
    success: true,
    data: newResource,
  });
});

const getCreatedByResources = catchAsync(async (req, res) => {
    const id = req.user.id;
    const resources = await LearningMaterialService.getCreatedByResourcesFromDB(id);
    res.status(200).json({
        success: true,
        data: resources,
    });
});

const getResourceById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const resource = await LearningMaterialService.getResourceByIdFromDB(id);
    res.status(200).json({
        success: true,
        data: resource,
    });
});

const  getAllResources = catchAsync(async (req, res) => {
    const resources = await LearningMaterialService.getAllMentorResourcesFromDB(req.query,req.user.id);
    res.status(200).json({
        success: true,
        data: resources,
    });
});

const getFilteredResources = catchAsync(async (req, res) => {
    const resources = await LearningMaterialService.getFilteredResourcesFromDB(req.query);
    res.status(200).json({
        success: true,
        data: resources,
    });
});

const updateResource = catchAsync(async (req, res) => {
    const id = req.params.id;
    const updateData = { ...req.body };
    
    // if (req.file) {
    //     updateData.pdf = req.file.path;
    // }
if (req.files && (req.files as any)["file"]?.[0]) {
    updateData.pdf = `/files/${(req.files as any)["file"][0].filename}`;
  }

    const updatedResource = await LearningMaterialService.updateResourceFromDB(id, updateData);
    res.status(200).json({ success: true, data: updatedResource });
});

const deleteResource = catchAsync(async (req, res) => {
    const id = req.params.id;
    await LearningMaterialService.deleteResourceFromDB(id);
    res.status(200).json({
        success: true,
        message: 'Learning Material deleted successfully',
    });
});


export const mentorLearningMaterial = {
    createResource,
    getCreatedByResources,
    getAllResources,
    getResourceById,
    updateResource,
    deleteResource,
    getFilteredResources
};