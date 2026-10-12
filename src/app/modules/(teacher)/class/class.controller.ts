import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { ClassService } from './class.service';
import { getSingleFilePath } from '../../../../shared/getFilePath';

const normalizeClassPayload = (body: any) => {
  const data = { ...body };

  // Normalize userGroup
  let rawGroup = data.userGroup !== undefined ? data.userGroup : data['userGroup[]'];
  if (typeof rawGroup === 'string') {
    try {
      rawGroup = JSON.parse(rawGroup);
    } catch {
      rawGroup = rawGroup.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  if (rawGroup !== undefined) {
    if (rawGroup === null || rawGroup === 'null' || rawGroup === '') {
      data.userGroup = [];
    } else {
      data.userGroup = Array.isArray(rawGroup) ? rawGroup.filter(Boolean) : [rawGroup];
    }
    delete data['userGroup[]'];
  }

  // Normalize studentAssigned / studentId
  let rawStudents =
    data.studentAssigned !== undefined
      ? data.studentAssigned
      : data['studentAssigned[]'] !== undefined
      ? data['studentAssigned[]']
      : data.studentId !== undefined
      ? data.studentId
      : data['studentId[]'];

  if (typeof rawStudents === 'string') {
    try {
      rawStudents = JSON.parse(rawStudents);
    } catch {
      rawStudents = rawStudents.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  if (rawStudents !== undefined) {
    if (rawStudents === null || rawStudents === 'null' || rawStudents === '') {
      data.studentAssigned = [];
      data.studentId = [];
    } else {
      const studentArr = Array.isArray(rawStudents) ? rawStudents.filter(Boolean) : [rawStudents];
      data.studentAssigned = studentArr;
      data.studentId = studentArr;
    }
    delete data['studentAssigned[]'];
    delete data['studentId[]'];
  }

  if (data.virtualClass !== undefined) {
    data.virtualClass = data.virtualClass === true || data.virtualClass === 'true';
  }

  if (data.status !== undefined) {
    data.status = data.status === true || data.status === 'true';
  }

  if (data.published !== undefined) {
    data.published = data.published === true || data.published === 'true';
  }

  if (!data.userGroupTrack || data.userGroupTrack === 'null' || data.userGroupTrack === 'undefined') {
    delete data.userGroupTrack;
  }

  return data;
};

const createClass = catchAsync(async (req: Request, res: Response) => {
  const file = getSingleFilePath(req.files, 'file');
  const classData = normalizeClassPayload(req.body);
  const teacherId = req.user?.id;
  if (!classData.teacher && teacherId) {
    classData.teacher = teacherId;
  }
  if (file) {
    classData.file = file;
  }

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
  const result = await ClassService.getAllClassesFromDB(query, req.user);

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
  const updateData = normalizeClassPayload(req.body);

  const file = getSingleFilePath(req.files, 'file');
  if (file) {
    updateData.file = file;
  } else if (req.body.file === 'null' || req.body.file === null) {
    updateData.file = null;
  }

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
