import { INotification } from '../app/modules/notification/notification.interface';
import { NotificationServices } from '../app/modules/notification/notification.service';

export const sendNotifications = async (data: any): Promise<INotification> => {
  return await NotificationServices.createNotification(data);
};