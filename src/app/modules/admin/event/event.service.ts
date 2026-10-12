import { Types } from "mongoose";
import QueryBuilder, { GetAllEventsQuery } from "../../../../shared/apiFeature";
import { IUser } from "../../user/user.interface";
import { IEvent } from "./event.interface";
import { Event } from "./event.model";
import { User } from "../../user/user.model";
import { emailTemplate } from "../../../../shared/emailTemplate";
import { emailHelper } from "../../../../helpers/emailHelper";
import { NotificationServices } from "../../notification/notification.service";

const createEventFromDB = async (payload: Partial<IEvent>) => {
  // Create the event first
  const event = await Event.create(payload);

  let studentFilter: Record<string, any> = { role: "STUDENT" };
  if (payload.studentAssigned && payload.studentAssigned.length > 0) {
    studentFilter = { _id: { $in: payload.studentAssigned } };
  } else if (payload.targetGroup || payload.group) {
    studentFilter = {
      role: "STUDENT",
      userGroup: payload.targetGroup || payload.group,
    };
    if (payload.targetTrack) {
      studentFilter.userGroupTrack = payload.targetTrack;
    }
  } else if (payload.targetTrack) {
    studentFilter = {
      role: "STUDENT",
      userGroupTrack: payload.targetTrack,
    };
  }

  const students = await User.find(
    studentFilter,
    "email firstName lastName _id",
  );

  // Send emails and in-app notifications in background without blocking the response
  if (students.length > 0) {
    setImmediate(async () => {
      try {
        const emailPromises = students.map((student) => {
          if (student.email) {
            const emailData = emailTemplate.eventInvitation({
              email: student.email,
              name: student.firstName || "Student",
              eventName: event.title,
              eventDescription: event.description,
              eventDate: event.date as any,
              eventLocation: event.location,
            });
            return emailHelper.sendEmail(emailData);
          }
          return Promise.resolve();
        });

        const eventDateStr = event.date
          ? new Date(event.date).toLocaleDateString()
          : "";

        const notificationPromises = students.map((student) =>
          NotificationServices.createNotification({
            receiver: student._id,
            title: `New Event: ${event.title}`,
            message:
              event.description ||
              `You have been invited to event "${event.title}"${eventDateStr ? ` on ${eventDateStr}` : ""}.`,
            type: "EVENT",
            refId: event._id as any,
            path: "/student/events",
            seen: false,
            read: false,
          }),
        );

        await Promise.all([...emailPromises, ...notificationPromises]);
      } catch (error) {
        console.error("Error sending background event notifications/emails:", error);
      }
    });
  }

  return event;
};

const getAllEventsFromDB = async (
  studentId: string | undefined,
  role: string | undefined,
  query?: any,
) => {
  const safeQuery = query || {};
  const page = Number(safeQuery.page) || 1;
  const limit = Number(safeQuery.limit) || 10;
  const skip = (page - 1) * limit;

  let finalFilter: any = {};


  if (role !== "SUPER_ADMIN") {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    finalFilter = {
      $or: [
        { studentAssigned: { $size: 0 } },
        { studentAssigned: { $exists: false } },
      ],
      status: "active",
      date: { $gte: today },
    };

    if (studentId) {
      finalFilter.$or.push({ studentAssigned: new Types.ObjectId(studentId) });
    }
  }

  if (safeQuery.targetGroup) {
    const groupCondition = {
      targetGroup: new Types.ObjectId(safeQuery.targetGroup),
    };

    if (Object.keys(finalFilter).length > 0) {
      finalFilter = { $and: [finalFilter, groupCondition] };
    } else {
      finalFilter = groupCondition;
    }
  }

  if (safeQuery.searchTerm) {
    const searchCondition = {
      $or: [
        { title: { $regex: safeQuery.searchTerm, $options: "i" } },
        { description: { $regex: safeQuery.searchTerm, $options: "i" } },
      ],
    };

    if (Object.keys(finalFilter).length > 0) {
      finalFilter = { $and: [finalFilter, searchCondition] };
    } else {
      finalFilter = searchCondition;
    }
  }

  const total = await Event.countDocuments(finalFilter);

  const events = await Event.find(finalFilter)
    .sort(safeQuery.sort || "-createdAt")
    .skip(skip)
    .limit(limit)
    .populate("targetTrack")
    .populate("targetGroup")
    .populate("studentAssigned")
    .exec();

  return {
    success: true,
    data: events || [],
    pagination: {
      total,
      totalPage: Math.ceil(total / limit),
      page,
      limit,
    },
  };
};

const getEventsForStudentFromDB = async (
  studentId: string,
  query?: GetAllEventsQuery,
) => {
  const safeQuery = query || {};

  const page = Number(safeQuery.page) || 1;
  const limit = Number(safeQuery.limit) || 10;
  const skip = (page - 1) * limit;

  let queryBuilder = Event.find({ studentAssigned: studentId });

  if (safeQuery.searchTerm) {
    queryBuilder = queryBuilder.find({
      $or: [
        { title: { $regex: safeQuery.searchTerm, $options: "i" } },
        { description: { $regex: safeQuery.searchTerm, $options: "i" } },
      ],
    });
  }

  const total = await queryBuilder.clone().countDocuments();

  const events = await queryBuilder
    .sort(safeQuery.sort || "-createdAt")
    .skip(skip)
    .limit(limit)
    .populate("targetTrack")
    .populate("targetGroup")
    .populate("studentAssigned")
    .exec();

  return {
    success: true,
    data: events || [],
    pagination: {
      total,
      totalPage: Math.ceil(total / limit),
      page,
      limit,
    },
  };
};

const getEventByIdFromDB = async (id: string) => {
  const result = await Event.findById(id)
    .populate("targetTrack")
    .populate("targetGroup")
    .populate("studentAssigned");
  return result;
};

const updateEventByIdInDB = async (id: string, payload: Partial<IEvent>) => {
  // Get the original event to compare student assignments
  const originalEvent = await Event.findById(id);
  if (!originalEvent) {
    throw new Error("Event not found");
  }

  // Update the event
  const updatedEvent = await Event.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  // If studentAssigned is being updated, send emails to newly added students only
  if (payload.studentAssigned && Array.isArray(payload.studentAssigned)) {
    const originalStudentIds = originalEvent.studentAssigned || [];
    const newStudentIds = payload.studentAssigned;

    // Find students who are newly added (in new but not in original)
    const newlyAddedStudentIds = newStudentIds.filter(
      (id) =>
        !originalStudentIds.some(
          (originalId) => originalId.toString() === id.toString(),
        ),
    );

    if (newlyAddedStudentIds.length > 0) {
      // Get details of newly added students
      const newStudents = await User.find(
        { _id: { $in: newlyAddedStudentIds } },
        "email firstName lastName",
      );

      // console.log("Newly added students to notify:", newStudents);

      // Send emails to newly added students only in background
      if (newStudents.length > 0 && updatedEvent) {
        // Use setImmediate to run email sending in background
        setImmediate(async () => {
          try {
            const emailPromises = newStudents.map((student) => {
              if (student.email) {
                const emailData = emailTemplate.eventInvitation({
                  email: student.email,
                  name: student.firstName || "Student",
                  eventName: updatedEvent.title,
                  eventDescription: updatedEvent.description,
                  eventDate: updatedEvent.date as any,
                  eventLocation: updatedEvent.location,
                });
                return emailHelper.sendEmail(emailData);
              }
              return Promise.resolve();
            });

            await Promise.all(emailPromises);
            // console.log(
            //   `Sent ${emailPromises.length} event invitation emails to newly added students in background`,
            // );
          } catch (error) {
            console.error(
              "Error sending background emails for updated event:",
              error,
            );
          }
        });
      }
    }
  }

  return updatedEvent;
};

const deleteEventByIdFromDB = async (id: string) => {
  const result = await Event.findByIdAndDelete(id);
  return result;
};

export const EventService = {
  createEventFromDB,
  getAllEventsFromDB,
  getEventByIdFromDB,
  updateEventByIdInDB,
  deleteEventByIdFromDB,
  getEventsForStudentFromDB,
};
