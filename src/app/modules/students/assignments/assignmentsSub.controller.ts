import { Request, Response } from 'express'
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { AssignmentsSubService } from './assignmentsSub.service';
import path from 'path';
import { StatusCodes } from 'http-status-codes';
import { Assignment } from '../../(teacher)/assignment/assignment.model';
import { AssignmentsSub } from './assignmentsSub.model';

// const submitAssignment = catchAsync(async (req: Request, res: Response) => {
//     const { assignmentId } = req.params;
//     const studentId = req.user?.id;

    // const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    // const fileData = files?.['submittedfile'] ? files['submittedfile'][0] : null;
    
    // let fileUrl = '';

    // if (fileData) {
    //     fileUrl = `/student-assignments/${fileData.filename}`;
    // }
    // if (!studentId || !fileUrl) {
    //     throw new Error(`Required data missing. studentId: ${studentId}, file: ${fileUrl}`);
    // }

//     const submissionData = {
//         assignmentId,
//         studentId,
//         fileAssignment: fileUrl,
//         ...req.body,
//     };

//     const result = await AssignmentsSubService.submitAssignmentIntoDB(submissionData);

//     await AssignmentsSub.findByIdAndUpdate(
//         assignmentId,
//         { 
//             submitAssignment: result._id, 
//             status: 'COMPLETED'          
//         }
//     );

//     sendResponse(res, {
//         statusCode: 201,
//         success: true,
//         message: 'Assignment submitted and linked successfully',
//         data: result,
//     });
// });
const submitAssignment = catchAsync(async (req: Request, res: Response) => {
    const { assignmentId } = req.params;
    const studentId = req.user?.id || (req.user as any)?._id;

   const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const fileData = files?.['submittedfile'] ? files['submittedfile'][0] : null;
    
    let fileUrl = '';

    if (fileData) {
        fileUrl = `/student-assignments/${fileData.filename}`;
    }
    if (!studentId || !fileUrl) {
        throw new Error(`Required data missing. studentId: ${studentId}, file: ${fileUrl}`);
    }
    const submissionData = {
        assignmentId,
        studentId,
        fileAssignment: fileUrl,
        ...req.body,
    };

    const result = await AssignmentsSubService.submitAssignmentIntoDB(submissionData);

    await Assignment.findByIdAndUpdate(
        assignmentId,
        { 
            $push: { submitAssignment: result._id },
        
        }
    );

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Assignment submitted and linked successfully',
        data: result,
    });
});


const getAssignmentSubmissions = catchAsync(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const result = await AssignmentsSubService.getSubmissionsForTeacherFromDB(assignmentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Submissions retrieved successfully',
    data: result,
  });
});

const getMySubmissions = catchAsync(async (req: Request, res: Response) => {
  // Assuming student ID comes from auth middleware
  const studentId = req.user?.id;
  const result = await AssignmentsSubService.getStudentOwnSubmissionsFromDB(studentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Your submissions retrieved successfully',
    data: result,
  });
});

const getMyAssignments = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id; 

    const result = await AssignmentsSubService.getMyAssignmentsFromDB(userId, req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Relevant assignments fetched successfully based on your track',
        data: result,
    });
});

const getUpcomingEvents = catchAsync(async (req: Request, res: Response) => {
    const result = await AssignmentsSubService.getupcomigEventsFromDB();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Upcoming events fetched successfully',
        data: result,
    });
});

const getAllSubmitedAssignments = catchAsync(async (req: Request, res: Response) => {
    const teacherId = req.user?.id;
    const query = req.query;

    const result = await AssignmentsSubService.getAllsubmitedAssignmentsFromDB(
        teacherId,
        query
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'All submitted assignments fetched successfully',
        data: result,
    });
});




export const AssignmentsSubController = {
  submitAssignment,
  getAssignmentSubmissions,
  getMySubmissions,
  getMyAssignments,
  getUpcomingEvents,
  getAllSubmitedAssignments,
};