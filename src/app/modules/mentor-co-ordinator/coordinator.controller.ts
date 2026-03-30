import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CoordinatorService } from "./coordinator.service";


const getstat = catchAsync(async (req: Request, res: Response) => {
    const result = await CoordinatorService.getDashboardStats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Stat retrieved successfully',
        data: result,
    });
});

const getAllMentors = catchAsync(async (req: Request, res: Response) => {
    console.log("Logged in user:", req.user);
    console.log("Query:", req.query);
    const result = await CoordinatorService.getAllMentorsFromDB( req.query);  

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Mentors retrieved successfully',
        data: result,
    });
});

const getmentorById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CoordinatorService.getMentorById(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Mentor retrieved successfully',
        data: result,
    });
});

const updateMentorStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await CoordinatorService.updateMentorStatusFromDB(id, status);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Mentor status updated successfully',
        data: result,
    });
});

const getAllClasses = catchAsync(async (req: Request, res: Response) => {
    const result = await CoordinatorService.getAllClassesFromDB(req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Classes retrieved successfully',
        data: result,
    });
});

const getClassById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CoordinatorService.getClassByIdFromDB(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Class retrieved successfully',
        data: result,
    });
});

const updateClassStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CoordinatorService.updateClassStatusFromDB(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Class status updated successfully',
        data: result,
    });
});

const getAllResources = catchAsync(async (req: Request, res: Response) => {
    const result = await CoordinatorService.getAllResourcesFromDB(req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Resources retrieved successfully',
        data: result,
    });
});

const getResourceById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CoordinatorService.getResourceByIdFromDB(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Resource retrieved successfully',
        data: result,
    });
});

const updateResourceStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CoordinatorService.updateResourceStatusFromDB(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Resource status updated successfully',
        data: result,
    });
});

const getlastFIveAdedStudents = catchAsync(async (req: Request, res: Response) => {
    const result = await CoordinatorService.getlastFIveAdedStudentsFromDB();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Last five added students retrieved successfully',
        data: result,
    });
});

const lastThreeResources = catchAsync(async (req: Request, res: Response) => {
    const result = await CoordinatorService.lastThreeResourcesFromDB();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Last three added resources retrieved successfully',
        data: result,
    });
});

export const CoordinatorController = {
    getstat,
    getAllMentors,
    getmentorById,
    updateMentorStatus,
    getAllClasses,
    getClassById,
    updateClassStatus,
    getAllResources,
    getResourceById,
    updateResourceStatus,
    getlastFIveAdedStudents,
    lastThreeResources
    }