import { Types } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
import { User } from '../user/user.model';
import { NotificationServices } from './notification.service';

export const sendNotificationToAllUsers = async ({
  title,
  message,
  path = '/',
  refId,
  type = 'GENERAL',
  sender = null,
  excludeRoles = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
}: {
  title: string;
  message: string;
  path?: string;
  refId?: Types.ObjectId | string;
  type?: string;
  sender?: Types.ObjectId | string | null;
  excludeRoles?: USER_ROLES[];
}) => {
  const filter: Record<string, any> = {};
  if (excludeRoles && excludeRoles.length > 0) {
    filter.role = { $nin: excludeRoles };
  }

  const users = await User.find(filter)
    .select('_id')
    .lean();

  if (!users || users.length === 0) {
    return [];
  }

  const notifications = await Promise.all(
    users.map(user =>
      NotificationServices.createNotification({
        receiver: user._id,
        sender: (sender as any) || null,
        title,
        message,
        refId,
        path,
        type,
        seen: false,
        read: false,
      })
    )
  );

  return notifications;
};

export const sendNotificationToRoles = async (
  roles: USER_ROLES[],
  payload: {
    title: string;
    message: string;
    path?: string;
    refId?: Types.ObjectId | string;
    type?: string;
    sender?: Types.ObjectId | string | null;
  }
) => {
  return await NotificationServices.sendNotificationToRoles(roles, payload);
};

export const sendNotificationToGroup = async (
  groupId: Types.ObjectId | string,
  payload: {
    title: string;
    message: string;
    path?: string;
    refId?: Types.ObjectId | string;
    type?: string;
    sender?: Types.ObjectId | string | null;
  }
) => {
  const users = await User.find({
    userGroup: typeof groupId === 'string' ? new Types.ObjectId(groupId) : groupId,
  })
    .select('_id')
    .lean();

  if (!users || users.length === 0) return [];

  const notifications = await Promise.all(
    users.map(user =>
      NotificationServices.createNotification({
        receiver: user._id,
        sender: (payload.sender as any) || null,
        title: payload.title,
        message: payload.message,
        refId: payload.refId,
        path: payload.path || '/',
        type: payload.type || 'GROUP',
        seen: false,
        read: false,
      })
    )
  );

  return notifications;
};

export const sendNotificationToTrack = async (
  trackId: Types.ObjectId | string,
  payload: {
    title: string;
    message: string;
    path?: string;
    refId?: Types.ObjectId | string;
    type?: string;
    sender?: Types.ObjectId | string | null;
  }
) => {
  const users = await User.find({
    userGroupTrack: typeof trackId === 'string' ? new Types.ObjectId(trackId) : trackId,
  })
    .select('_id')
    .lean();

  if (!users || users.length === 0) return [];

  const notifications = await Promise.all(
    users.map(user =>
      NotificationServices.createNotification({
        receiver: user._id,
        sender: (payload.sender as any) || null,
        title: payload.title,
        message: payload.message,
        refId: payload.refId,
        path: payload.path || '/',
        type: payload.type || 'TRACK',
        seen: false,
        read: false,
      })
    )
  );

  return notifications;
};

export const sendNotificationToUser = async (
  userId: Types.ObjectId | string,
  payload: {
    title: string;
    message: string;
    path?: string;
    refId?: Types.ObjectId | string;
    type?: string;
    sender?: Types.ObjectId | string | null;
  }
) => {
  return await NotificationServices.createNotification({
    receiver: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
    sender: (payload.sender as any) || null,
    title: payload.title,
    message: payload.message,
    refId: payload.refId,
    path: payload.path || '/',
    type: payload.type || 'GENERAL',
    seen: false,
    read: false,
  });
};
