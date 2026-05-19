import { Request, Response } from 'express';
import catchAsync from '../../../../shared/catchAsync';
import { WeeklyReportService } from './report.service';

const createWeeklyReport = catchAsync(async (req: Request, res: Response) => {
    const reportData = req.body;
    reportData.createdBy = req.user.id;
    const newReport = await WeeklyReportService.createWeeklyReport(reportData);
    res.status(201).json({
        success: true,
        data: newReport,
    });
});

const getStudentReports = catchAsync(async (req: Request, res: Response) => {
    const studentOrCreatedBy = req.params.studentId;
    const reports = await WeeklyReportService.getStudentReportsFromDB(studentOrCreatedBy);
    res.status(200).json({
        success: true,
        data: reports,
    });
});

const getAllReports = catchAsync(async (req: Request, res: Response) => {
    const reports = await WeeklyReportService.getAllStudentReportsFromDB(req.query);
    res.status(200).json({
        success: true,
        data: reports,
    });
});

const updateWeeklyReport = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const updateData = req.body;
    const updatedReport = await WeeklyReportService.updateWeeklyReportInDB(id, updateData);
    res.status(200).json({
        success: true,
        data: updatedReport,
    });
});

const deleteWeeklyReport = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await WeeklyReportService.deleteWeeklyReportFromDB(id);
    res.status(200).json({
        success: true,
        message: 'Weekly Report deleted successfully',
    });
});


const getReportByStudentIdAndWeekRange = catchAsync(async (req: Request, res: Response) => {
    const studentId = req.params.studentId;

    const reports = await WeeklyReportService.getReportByStudentIdAndWeekRange(studentId);

    res.status(200).json({
        success: true,
        message: "Reports retrieved successfully",
        data: {
            reports: reports
        },
    });
});



export const mentorWeeklyReport = {
    createWeeklyReport,
    getStudentReports,
    getAllReports,
    deleteWeeklyReport,
    updateWeeklyReport,
    getReportByStudentIdAndWeekRange,
};