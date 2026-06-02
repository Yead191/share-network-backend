import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { internshipService } from './internship.service';
import { getSingleFilePath } from '../../../shared/getFilePath';
import { Body } from 'twilio/lib/twiml/MessagingResponse';

// ─── Create ──────────────────────────────────────────────────────────────────

const createInternship = catchAsync(async (req: Request, res: Response) => {

  const cv = getSingleFilePath(req?.files, 'cv')
  const data = {
    ...req.body,
    cv
  }
  // console.log(data)
  const result = await internshipService.createInternship(data);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Internship profile created successfully',
    data: result,
  });
});

// ─── Get All ─────────────────────────────────────────────────────────────────

const getAllInternships = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, searchTerm } = req.query;

  const result = await internshipService.getAllInternships({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    searchTerm: searchTerm as string | undefined,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Internship profiles retrieved successfully',
    data: result?.data,
  });
});

// ─── Get Single ───────────────────────────────────────────────────────────────

const getInternshipById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await internshipService.getInternshipById(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Internship profile retrieved successfully',
    data: result,
  });
});

// ─── Update ───────────────────────────────────────────────────────────────────

const updateInternship = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const cv = getSingleFilePath(req?.files, 'cv');
  const data = {
    ...req.body,
    cv,
  };
  const result = await internshipService.updateInternship(id, data);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Internship profile updated successfully',
    data: result,
  });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteInternship = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await internshipService.deleteInternship(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

// ─── Export ───────────────────────────────────────────────────────────────────

export const internshipController = {
  createInternship,
  getAllInternships,
  getInternshipById,
  updateInternship,
  deleteInternship,
};
