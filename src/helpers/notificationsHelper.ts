import { INotification } from "../app/modules/notification/notification.interface";
import { NotificationServices } from "../app/modules/notification/notification.service";

export const sendNotifications = async (
  data: any,
): Promise<INotification | void> => {
  try {
    return await NotificationServices.createNotification(data);
  } catch (error) {
    console.log(error);
  }
};
