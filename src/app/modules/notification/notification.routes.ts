import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';

const router = express.Router();

const ALL_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.MENTOR,
  USER_ROLES.TEACHER,
  USER_ROLES.COORDINATOR,
  USER_ROLES.STUDENT,
];

const CREATOR_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.MENTOR,
  USER_ROLES.TEACHER,
  USER_ROLES.COORDINATOR,
];

router
  .route('/')
  .get(auth(...ALL_ROLES), NotificationController.getAllNotifications)
  .post(auth(...CREATOR_ROLES), NotificationController.createNotification)
  .patch(auth(...ALL_ROLES), NotificationController.readAllNotifications);

router.delete(
  '/clear-all',
  auth(...ALL_ROLES),
  NotificationController.clearAllNotifications
);

// Legacy routes for backwards compatibility
router.get(
  '/mentor',
  auth(...ALL_ROLES),
  NotificationController.adminNotificationFromDB
);
router.patch(
  '/admin',
  auth(...ALL_ROLES),
  NotificationController.adminReadNotification
);

router
  .route('/:id')
  .get(auth(...ALL_ROLES), NotificationController.getSingleNotification)
  .patch(auth(...ALL_ROLES), NotificationController.readSingleNotification)
  .delete(auth(...ALL_ROLES), NotificationController.deleteNotification);

export const NotificationRoutes = router;
