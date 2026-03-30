import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from './user.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { get } from 'mongoose';

// register user
const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    await UserService.createUserToDB(userData);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Please check your email to verify your account. We have sent you an OTP to complete the registration process.',
    })
});

// register admin
const createAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    const result = await UserService.createAdminToDB(userData);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Admin created successfully',
        data: result
    });
});

// retrieved user profile
const getUserProfile = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await UserService.getProfileFromDB(user);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Profile data retrieved successfully',
        data: result
    });
});

//update profile
const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
       
       
        
    let profile,tradeLicences, proofOwnerId, sallonPhoto;
    if (req.files && 'image' in req.files && req.files.image[0]) {
        profile = `/images/${req.files.image[0].filename}`;
    }
    

    const data = {
        profile,
        ...req.body,
    };
    const result = await UserService.updateProfileToDB(user, data);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Profile updated successfully',
        data: result
    });
});

//update profile
const updateLocation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const payload = {
        longitude: Number(req.body.longitude),
        latitude: Number(req.body.latitude)
    }
    const result = await UserService.updateLocationToDB(user, payload);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'User Location Updated successfully',
        data: result
    });
});

const updateprofileById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { ...payload } = req.body;
    const result = await UserService.updateprofileByIdToDB(id, payload);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Profile updated successfully',
        data: result
    });
});

const getStudents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const mentorId = req.user.id;
    const result = await UserService.getStudentsFromDB(mentorId);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Students data retrieved successfully',
        data: result
    });
});

const removeAssignedStudent = catchAsync(async (req: Request, res: Response) => {
  const { mentorId, studentId } = req.params;

  const result = await UserService.removeAssignedFromDB(
    mentorId,
    studentId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Assigned removed successfully",
    data: result,
  });
});

const updateActivity = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result = await UserService.updateActivityFromDB(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Activity updated successfully',
        data: result
    });
});

export const UserController = {
    createUser,
    createAdmin,
    getUserProfile,
    updateProfile,
    updateLocation,
    updateprofileById,
    getStudents,
    removeAssignedStudent,
    updateActivity
};