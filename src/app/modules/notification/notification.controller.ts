import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { NotificationServices } from './notification.service';

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.getAllNotifications(
    req.user,
    req.query
  );

  return sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notifications retrieved successfully!',
    data: result.data,
    pagination: result.pagination,
  });
});

const getSingleNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NotificationServices.getSingleNotification(id);

  return sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notification retrieved successfully',
    data: result,
  });
});

const createNotification = catchAsync(async (req: Request, res: Response) => {
  const data = { ...req.body };
  // Default sender to logged in user if not specified
  if (!data.sender && req.user?.id) {
    data.sender = req.user.id;
  }
  const result = await NotificationServices.createNotification(data);

  return sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notification created successfully!',
    data: result,
  });
});

const updateNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = { ...req.body };
  const result = await NotificationServices.updateNotification(id, payload);

  return sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notification updated successfully',
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NotificationServices.deleteNotification(id, req.user);

  return sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notification deleted successfully!',
    data: result,
  });
});

const readSingleNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NotificationServices.readSingleNotification(id, req.user);

  return sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notification marked as read successfully!',
    data: result,
  });
});

const readAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await NotificationServices.readAllNotifications(user);

  return sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'All notifications marked as read successfully!',
    data: result,
  });
});

const clearAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await NotificationServices.clearAllNotifications(user);

  return sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'All notifications cleared successfully!',
    data: result,
  });
});

// Legacy controller method aliases for backward compatibility
const getNotificationFromDB = getAllNotifications;
const readNotification = readAllNotifications;
const adminNotificationFromDB = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.adminNotificationFromDB(req.user, req.query);
  return sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Notifications Retrieved Successfully',
    data: (result as any).data || (result as any).result || result,
    pagination: (result as any).pagination,
  });
});
const adminReadNotification = readAllNotifications;

export const NotificationController = {
  getAllNotifications,
  getSingleNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  readSingleNotification,
  readAllNotifications,
  clearAllNotifications,
  // Legacy exports
  getNotificationFromDB,
  readNotification,
  adminNotificationFromDB,
  adminReadNotification,
};
