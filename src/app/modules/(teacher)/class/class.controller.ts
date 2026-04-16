import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { ClassService } from './class.service';
import { getSingleFilePath } from '../../../../shared/getFilePath';

const createClass = catchAsync(async (req: Request, res: Response) => {

  const file = getSingleFilePath(req.files, 'file');
  const { ...classData } = req.body;
  const teacherId = req.user?.id;
  classData.teacher = teacherId;
  classData.file = file;

  const result = await ClassService.createClassToDB(classData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Class Created successfully',
    data: result,
  });
});

const getAllClasses = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await ClassService.getAllClassesFromDB(query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'All classes retrieved successfully',
    pagination: result.pagination,
    data: result.classes,
  });
});

const getClassById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ClassService.getClassByIdFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Class retrieved successfully',
    data: result,
  });
});

const updateClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ...updateData } = req.body;

  const file = getSingleFilePath(req.files, 'file');
  updateData.file = file;
  
  const { message, result } = await ClassService.updateClassToDB(id, updateData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message,
    data: result,
  });
});

const deleteClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, result } = await ClassService.deleteClassFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message,
    data: result,
  });
});

export const ClassController = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
};
