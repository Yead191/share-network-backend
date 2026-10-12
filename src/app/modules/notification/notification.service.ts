import { Types } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import QueryBuilder from '../../../shared/apiFeature';
import { firebaseHelper } from '../../../shared/firebaseHelper';
import { USER_ROLES } from '../../../enums/user';
import { User } from '../user/user.model';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';

const formatUserRef = (user: any) => {
  if (!user || typeof user !== 'object') return user;
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || user.email || 'User';

  return {
    _id: user._id,
    name: fullName,
    email: user.email,
    image: user.profile || user.image || '',
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    profile: user.profile,
  };
};

const createNotification = async (data: Partial<INotification>) => {
  const io = (global as any).socketServer || (global as any).io;

  const title = data.title || data.text || 'New Notification';
  const message = data.message || data.text || '';
  const text = data.text || data.message || data.title;
  const path = data.path || (data.screen ? `/${data.screen.toLowerCase()}` : '/');
  const refId = data.refId || data.referenceId;
  const seen = data.seen ?? data.read ?? false;
  const read = data.read ?? data.seen ?? false;

  const notificationData = {
    ...data,
    title,
    message,
    text,
    path,
    refId,
    seen,
    read,
  };

  const result = await Notification.create(notificationData);

  // Send push notification if user has registered device token
  if (data.receiver) {
    try {
      const user = await User.findById(data.receiver).select('deviceToken').lean();
      if (user?.deviceToken) {
        const pushMessage = {
          notification: {
            title,
            body: message || text || title,
          },
          token: user.deviceToken,
        };
        firebaseHelper.sendPushNotification(pushMessage);
      }
    } catch (err) {
      console.error('Failed to send push notification:', err);
    }
  }

  // Real-time socket emissions (single targeted event)
  if (io && data.receiver) {
    const receiverId = data.receiver.toString();
    io.emit(`getNotification::${receiverId}`, result);
  }

  return result;
};

const sendNotificationToAdmins = async (payload: {
  title: string;
  message: string;
  refId?: any;
  path?: string;
  type?: string;
  sender?: Types.ObjectId | string | null;
}) => {
  const admins = await User.find({
    role: { $in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] },
  })
    .select('_id deviceToken')
    .lean();

  if (!admins || admins.length === 0) return [];

  const notifications = await Promise.all(
    admins.map(admin =>
      createNotification({
        receiver: admin._id,
        sender: (payload.sender as any) || null,
        title: payload.title,
        message: payload.message,
        refId: payload.refId,
        path: payload.path || '/',
        type: payload.type || 'ADMIN',
        seen: false,
        read: false,
      })
    )
  );

  return notifications;
};

const sendNotificationToRoles = async (
  roles: USER_ROLES[],
  payload: {
    title: string;
    message: string;
    refId?: any;
    path?: string;
    type?: string;
    sender?: Types.ObjectId | string | null;
  }
) => {
  const users = await User.find({
    role: { $in: roles },
  })
    .select('_id deviceToken')
    .lean();

  if (!users || users.length === 0) return [];

  const notifications = await Promise.all(
    users.map(user =>
      createNotification({
        receiver: user._id,
        sender: (payload.sender as any) || null,
        title: payload.title,
        message: payload.message,
        refId: payload.refId,
        path: payload.path || '/',
        type: payload.type || 'ROLE',
        seen: false,
        read: false,
      })
    )
  );

  return notifications;
};

const getAllNotifications = async (
  user: JwtPayload,
  query: Record<string, any>
) => {
  const filterConditions: Record<string, any> = {
    receiver: new Types.ObjectId(user.id),
  };

  if (query.seen !== undefined) {
    const isSeen = query.seen === 'true' || query.seen === true;
    filterConditions.seen = isSeen;
  }

  if (query.type) {
    filterConditions.type = query.type;
  }

  const queryClone = { ...query };
  delete queryClone.seen;
  delete queryClone.type;

  const notificationsQuery = new QueryBuilder(
    Notification.find(filterConditions)
      .populate('sender', '_id firstName lastName email profile role')
      .populate('receiver', '_id firstName lastName email profile role'),
    queryClone
  )
    .search(['title', 'message', 'text'])
    .filter()
    .sort()
    .paginate();

  const unreadCount = await Notification.countDocuments({
    receiver: user.id,
    $or: [{ seen: false }, { read: false }],
  });

  const [rawNotifications, pagination] = await Promise.all([
    notificationsQuery.queryModel.lean(),
    notificationsQuery.getPaginationInfo(),
  ]);

  const notifications = (rawNotifications || []).map((notif: any) => ({
    ...notif,
    sender: notif.sender ? formatUserRef(notif.sender) : null,
    receiver: notif.receiver ? formatUserRef(notif.receiver) : notif.receiver,
  }));

  return {
    data: { unreadCount, data: notifications },
    pagination,
  };
};

const getSingleNotification = async (id: string) => {
  const notification = await Notification.findById(id)
    .populate('sender', '_id firstName lastName email profile role')
    .populate('receiver', '_id firstName lastName email profile role')
    .lean();

  if (!notification) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }

  return {
    ...notification,
    sender: notification.sender ? formatUserRef(notification.sender) : null,
    receiver: notification.receiver ? formatUserRef(notification.receiver) : notification.receiver,
  };
};

const updateNotification = async (
  id: string,
  payload: Partial<INotification>
) => {
  const isExist = await Notification.findById(id);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }

  const updateData: any = { ...payload };
  if (payload.seen !== undefined && payload.read === undefined) {
    updateData.read = payload.seen;
  }
  if (payload.read !== undefined && payload.seen === undefined) {
    updateData.seen = payload.read;
  }

  const result = await Notification.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );
  return result;
};

const deleteNotification = async (id: string, user?: JwtPayload) => {
  const query: any = { _id: id };
  if (user && user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
    query.receiver = user.id;
  }

  const isExist = await Notification.findOne(query);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }

  const result = await Notification.deleteOne({ _id: id });
  return result;
};

const readSingleNotification = async (id: string, user?: JwtPayload) => {
  const query: any = { _id: id };
  if (user && user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN) {
    query.receiver = user.id;
  }

  const isExist = await Notification.findOne(query);
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }

  const result = await Notification.findByIdAndUpdate(
    id,
    { $set: { seen: true, read: true } },
    { new: true }
  );
  return result;
};

const readAllNotifications = async (user: JwtPayload) => {
  const result = await Notification.updateMany(
    { receiver: user.id, $or: [{ seen: false }, { read: false }] },
    { $set: { seen: true, read: true } }
  );
  return result;
};

const clearAllNotifications = async (user: JwtPayload) => {
  const result = await Notification.deleteMany({ receiver: user.id });
  return result;
};

// Legacy backwards compatibility methods
const getNotificationFromDB = async (
  user: JwtPayload,
  query: Record<string, any>
) => {
  const result = await getAllNotifications(user, query);
  return {
    notifications: result.data.data as any,
    pagination: result.pagination,
    unreadCount: result.data.unreadCount,
  };
};

const readNotificationToDB = async (user: JwtPayload) => {
  return await readAllNotifications(user);
};

const adminNotificationFromDB = async (user?: JwtPayload, query: Record<string, any> = {}) => {
  if (user) {
    return await getAllNotifications(user, query);
  }
  const notifications = await Notification.find({
    type: { $in: ['MENTOR', 'ADMIN', 'GENERAL'] },
  })
    .sort({ createdAt: -1 })
    .lean();
  return { result: notifications };
};

const adminReadNotificationToDB = async (user?: JwtPayload) => {
  if (user) {
    return await readAllNotifications(user);
  }
  const result = await Notification.updateMany(
    { type: { $in: ['MENTOR', 'ADMIN'] }, $or: [{ seen: false }, { read: false }] },
    { $set: { seen: true, read: true } }
  );
  return result;
};

export const NotificationService = {
  createNotification,
  sendNotificationToAdmins,
  sendNotificationToRoles,
  getAllNotifications,
  getSingleNotification,
  updateNotification,
  deleteNotification,
  readSingleNotification,
  readAllNotifications,
  clearAllNotifications,
  // Legacy aliases
  getNotificationFromDB,
  readNotificationToDB,
  adminNotificationFromDB,
  adminReadNotificationToDB,
};

export const NotificationServices = NotificationService;
