
import { Request, Response } from 'express';
;
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { UserService } from './mentor.service';
import admin from 'firebase-admin';


const bulkUploadMentors = catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Please upload an excel file");
    }

    const result = await UserService.bulkImportMentors(req.file.buffer);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Mentors imported successfully',
        data: result,
    });
});

const getAllMentors = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.getAllMentorsFromDB(req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Mentors retrieved successfully',
        data: result,
    });
});

const getMentorById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserService.getMentorById(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Mentor retrieved successfully',
        data: result,
    });
});

const updateMentor = catchAsync(async (req: Request, res: Response) => {
    console.log(req.body);
    const { id } = req.params;
    const updateData = req.body;
    const result = await UserService.updateMentor(id, updateData);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Mentor updated successfully',
        data: result,
    });
});

const deleteMentor = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserService.deleteMentor(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Mentor deleted successfully',
        data: result,
    });
});

export const adminMentorController = {
    bulkUploadMentors,
    getAllMentors,
    getMentorById,
    updateMentor,
    deleteMentor
};