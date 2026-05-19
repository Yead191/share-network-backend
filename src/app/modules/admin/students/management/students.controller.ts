import { Request, Response } from 'express';
import httpStatus from 'http-status-codes';
import catchAsync from '../../../../../shared/catchAsync';
import sendResponse from '../../../../../shared/sendResponse';
import { StudentService } from './students.service';


const createStudent = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.createStudentIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student profile created successfully',
    data: result,
  });
});

const getAllStudents = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.getAllStudentsFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Students retrieved successfully',
    data: result,
  });
});

const getStudentsForTeacher = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.getStudentsForTeacherFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Students retrieved successfully',
    pagination: result?.pagination,
    data: result.data,
  });
});

const getSingleStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.getSingleStudentFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student retrieved successfully',
    data: result,
  });
});

const updateStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.updateStudentInDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student profile updated successfully',
    data: result,
  });
});

const addReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const reviewData = req.body; // Body te rating, comment, reviewerId thakbe
  const result = await StudentService.addReviewToStudent(id, reviewData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review added successfully',
    data: result,
  });
});

const getmystats = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.params.studentId;
  const result = await StudentService.getmystatsFromDB(studentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student stats fetched successfully',
    data: result
  });
});

const deleteStudent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.deleteStudentFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Student deleted successfully',
    data: result,
  });
});

// saveOnboardingAnswers
const saveOnboardingAnswers = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user.id;
  const answers = req.body;
  const result = await StudentService.saveOnboardingAnswersFromDB(studentId, answers);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Onboarding answers saved successfully',
    data: result,
  });
});

export const StudentController = {
  createStudent,
  getAllStudents,
  getSingleStudent,
  updateStudent,
  addReview,
  deleteStudent,
  //   oopsGoals
  getmystats,
  saveOnboardingAnswers,
  getStudentsForTeacher
};