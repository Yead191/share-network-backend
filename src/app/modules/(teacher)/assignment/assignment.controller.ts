import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { AssignmentService } from './assignment.service';
import { getMultipleFilesPath, getSingleFilePath } from '../../../../shared/getFilePath';


const normalizeAssignmentPayload = (body: any) => {
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
    data.userGroup = Array.isArray(rawGroup) ? rawGroup : [rawGroup];
    delete data['userGroup[]'];
  }

  // Normalize studentAssigned
  let rawStudents = data.studentAssigned !== undefined ? data.studentAssigned : data['studentAssigned[]'];
  if (typeof rawStudents === 'string') {
    try {
      rawStudents = JSON.parse(rawStudents);
    } catch {
      rawStudents = rawStudents.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  if (rawStudents !== undefined) {
    data.studentAssigned = Array.isArray(rawStudents) ? rawStudents : [rawStudents];
    delete data['studentAssigned[]'];
  }

  if (data.totalPoint !== undefined && data.totalPoint !== '') {
    data.totalPoint = Number(data.totalPoint);
  }

  if (data.published !== undefined) {
    data.published = data.published === true || data.published === 'true';
  }

  if (!data.userGroupTrack || data.userGroupTrack === 'null' || data.userGroupTrack === 'undefined') {
    delete data.userGroupTrack;
  }

  return data;
};

const createAssignment = catchAsync(async (req: Request, res: Response) => {
  const assignmentData = normalizeAssignmentPayload(req.body);
  const teacherId = req.user?.id;
  let attachment = getSingleFilePath(req.files, 'attachment');
  if (attachment) {
    assignmentData.attachment = attachment;
  }
  assignmentData.teacher = teacherId;
  const result = await AssignmentService.createAssignmentToDB(assignmentData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Assignment Created successfully',
    data: result,
  });
});

const getAllAssignments = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await AssignmentService.getAllAssignmentsFromDB(query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'All assignments retrieved successfully',
    pagination: result.pagination,
    data: result.assignments,
  });
});

const getAssignmentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssignmentService.getAssignmentByIdFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Assignment retrieved successfully',
    data: result,
  });
});

const updateAssignment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = normalizeAssignmentPayload(req.body);
  const teacherId = req.user?.id;
  let attachment = getSingleFilePath(req.files, 'attachment');
  if (attachment) {
    updateData.attachment = attachment;
  }
  updateData.teacher = teacherId;
  const result = await AssignmentService.updateAssignmentToDB(id, updateData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Assignment updated successfully',
    data: result,
  });
});

const deleteAssignment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssignmentService.deleteAssignmentFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Assignment deleted successfully',
    data: result,
  });
});

const addmarksAndFeedbackToSubmission = catchAsync(async (req: Request, res: Response) => {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    if (marks === '' || feedback === '') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Marks and feedback are required',
        });
    }

    const result = await AssignmentService.addmarksAndFeedbackToSubmission(
        submissionId,
        marks,
        feedback
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Marks and feedback added successfully',
        data: result,
    });
});

export const AssignmentController = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  addmarksAndFeedbackToSubmission,
};
