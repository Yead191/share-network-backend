import { Request, Response } from 'express';
import catchAsync from '../../../../../shared/catchAsync';
import sendResponse from '../../../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { AttendanceService } from './attendence.service';
import { group } from 'console';


// Save the whole list
const saveBatchAttendance = catchAsync(async (req: Request, res: Response) => {
    const takenBy = req.user.id;
    req.body.takenBy = takenBy;
    const result = await AttendanceService.saveBatchAttendanceInDB(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Class attendance saved successfully',
        data: result,
    });
});

// Update one student (Patch)
const updateStudentStatus = catchAsync(async (req: Request, res: Response) => {
    const { date, groupId, studentId, status, note } = req.body;

    const result = await AttendanceService.updateSingleStudentStatus(
        date, 
        groupId, 
        studentId, 
        status, 
        note
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Student status updated successfully',
        data: result,
    });
});

// Get View
const getAttendance = catchAsync(async (req: Request, res: Response) => {
    const { date, groupId } = req.query;

    const result = await AttendanceService.getAttendanceByDateAndClass(
        date as string, 
        groupId as string
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Attendance fetched successfully',
        data: result,
    });
});

const getAttendanceStats = catchAsync(async (req: Request, res: Response) => {
    const { groupId } = req.params;

    const result = await AttendanceService.getStudentAttendanceStats(groupId, req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Student attendance statistics fetched successfully',
        data: result,
    });
});

const updateSpecificRecord = catchAsync(async (req: Request, res: Response) => {    
    const result = await AttendanceService.updateallAttendanceRecordsFromDB( 
        req.params.id,
        req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Attendance updated successfully',
        data: result,
    });
});

const getStudentIdFromAttendance = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AttendanceService.getstudentIdFromAttendance(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Student ID retrieved successfully',
        data: result,
    });
});

const getRecentAttendance = catchAsync(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 3;

    const result = await AttendanceService.getRecentAttendance(days);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `Attendance records from the last ${days} days fetched successfully`,
        data: result,
    });
});

export const AttendanceController = {
    saveBatchAttendance,
    updateStudentStatus,
    getAttendance,
    getAttendanceStats,
    updateSpecificRecord,
    getStudentIdFromAttendance,
    getRecentAttendance
};