import { User } from "../../user/user.model";
import { emailTemplate } from "../../../../shared/emailTemplate";
import { emailHelper } from "../../../../helpers/emailHelper";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../../errors/ApiError";
import QueryBuilder from "../../../../shared/apiFeature";
import { IAssignment } from "./assignment.interface";
import { Assignment } from "./assignment.model";
import { UserGroupTrack } from "../../user-group/user-group-track/user-group-track.model";
import { UserGroup } from "../../user-group/user-group.model";
import { RecentActivity } from "../recentActivities/recentActivity.model";
import { AssignmentsSub } from "../../students/assignments/assignmentsSub.model";
import { NotificationServices } from "../../notification/notification.service";
import mongoose from "mongoose";

const createAssignmentToDB = async (payload: IAssignment) => {
  payload.totalPoint = Number(payload.totalPoint);

  if (payload.userGroupTrack) {
    const isUserGroupTrackExist = await UserGroupTrack.exists({
      _id: payload.userGroupTrack,
    });
    if (!isUserGroupTrackExist) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User Group Track Id not found!",
      );
    }
  }
  if (payload.userGroup) {
    const isUserGroupExist = await UserGroup.exists({
      _id: { $in: payload.userGroup },
    });
    if (!isUserGroupExist) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User Group Id not found!");
    }
  }
  const result = await Assignment.create(payload);

  // Create recent activity
  RecentActivity.create({
    title: `${result.title}`,
    description: ` ${result.description}`,
    type: "ASSIGNMENT",
    user: result.teacher,
    referenceId: result._id,
  });

  // Targeted students filter
  let studentFilter: Record<string, any> = { role: "STUDENT" };
  if (payload.studentAssigned && payload.studentAssigned.length > 0) {
    studentFilter = { _id: { $in: payload.studentAssigned } };
  } else if (payload.userGroup && payload.userGroup.length > 0) {
    studentFilter = {
      role: "STUDENT",
      userGroup: { $in: payload.userGroup },
    };
    if (payload.userGroupTrack) {
      studentFilter.userGroupTrack = payload.userGroupTrack;
    }
  } else if (payload.userGroupTrack) {
    studentFilter = {
      role: "STUDENT",
      userGroupTrack: payload.userGroupTrack,
    };
  }

  // Send notifications in background
  setImmediate(async () => {
    try {
      const students = await User.find(studentFilter).select("_id").lean();
      if (students && students.length > 0) {
        const dueDateStr = result.dueDate
          ? new Date(result.dueDate).toLocaleDateString()
          : "";
        await Promise.all(
          students.map((student) =>
            NotificationServices.createNotification({
              receiver: student._id,
              sender: result.teacher,
              title: `New Assignment: ${result.title}`,
              message:
                result.description ||
                `You have a new assignment "${result.title}"${dueDateStr ? ` due on ${dueDateStr}` : ""}.`,
              type: "ASSIGNMENT",
              refId: result._id,
              path: "/student/assignment",
              seen: false,
              read: false,
            }),
          ),
        );
      }
    } catch (error) {
      console.error("Error sending assignment notifications:", error);
    }
  });

  return result;
};

const getAllAssignmentsFromDB = async (query: Record<string, any>) => {
  const searchableFields = ["title", "type", "userGroupTrack", "userGroup"];

  const preFilter: Record<string, any> = {};

  if (query.userGroup) {
    preFilter.userGroup = new mongoose.Types.ObjectId(
      query.userGroup as string,
    );
    delete query.userGroup;
  }

  if (query.userGroupTrack) {
    preFilter.userGroupTrack = new mongoose.Types.ObjectId(
      query.userGroupTrack as string,
    );
    delete query.userGroupTrack;
  }

  const result = new QueryBuilder(
    Assignment.find(preFilter)
      .populate("userGroup")
      .populate("userGroupTrack")
      .populate({
        path: "submitAssignment",
        populate: [
          {
            path: "assignmentId",
            model: "Assignment",
            select: "title description",
          },
          {
            path: "studentId",
            model: "User",
            select: "name email mobilenumber role",
          },
        ],
      }),
    query,
  )
    .search(searchableFields)
    .filter()
    .sort()
    .paginate();

  const assignments = await result.queryModel;
  const pagination = await result.getPaginationInfo();
  return { assignments, pagination };
};
const getAssignmentByIdFromDB = async (id: string) => {
  const result = await Assignment.findById(id)
    .populate("userGroup")
    .populate("userGroupTrack")
    .populate("studentAssigned", "firstName lastName email profile");
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Assignment doesn't exist!");
  }
  return result;
};

// const updateAssignmentToDB = async (id: string, payload: Partial<IAssignment>) => {

//   if(payload.totalPoint){
//     payload.totalPoint = Number(payload.totalPoint);
//   }

//   if(payload.userGroupTrack){
//     const isUserGroupTrackExist = await UserGroupTrack.exists({
//       _id: payload.userGroupTrack
//     });
//     if(!isUserGroupTrackExist){
//       throw new ApiError(StatusCodes.NOT_FOUND, "User Group Track Id not found!");
//     }
//   }
//   if(payload.userGroup){
//     const isUserGroupExist = await UserGroup.exists({_id: {$in: payload.userGroup}});
//     if(!isUserGroupExist){
//       throw new ApiError(StatusCodes.NOT_FOUND, "User Group Id not found!");
//     }
//   }
//   console.log('payload-',payload)
//   const result = await Assignment.findByIdAndUpdate(id, payload, { new: true });
//   if (!result) {
//     throw new ApiError(StatusCodes.NOT_FOUND, "Assignment doesn't exist!");
//   }
//   return  result ;
// };
const updateAssignmentToDB = async (
  id: string,
  payload: Partial<IAssignment>,
) => {
  if (payload.totalPoint !== undefined) {
    payload.totalPoint = Number(payload.totalPoint);
  }

  if (payload.userGroupTrack !== undefined) {
    if (payload.userGroupTrack) {
      const isUserGroupTrackExist = await UserGroupTrack.exists({
        _id: payload.userGroupTrack,
      });
      if (!isUserGroupTrackExist) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          "User Group Track Id not found!",
        );
      }
    }
  }

  if (payload.userGroup !== undefined) {
    if (Array.isArray(payload.userGroup) && payload.userGroup.length > 0) {
      const isUserGroupExist = await UserGroup.exists({
        _id: { $in: payload.userGroup },
      });
      if (!isUserGroupExist) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User Group Id not found!");
      }
    }
  }

  console.log("payload-", payload);
  const result = await Assignment.findByIdAndUpdate(id, payload, { new: true });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Assignment doesn't exist!");
  }
  return result;
};

const deleteAssignmentFromDB = async (id: string) => {
  const result = await Assignment.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Assignment doesn't exist!");
  }
  return result;
};

const addmarksAndFeedbackToSubmission = async (
  submissionId: string,
  marks: number,
  feedback: string,
) => {
  const submission = await AssignmentsSub.findById(submissionId);
  if (!submission) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Submission not found");
  }

  submission.marks = marks;
  submission.feedback = feedback;
  await submission.save();

  return submission;
};

export const AssignmentService = {
  createAssignmentToDB,
  getAllAssignmentsFromDB,
  getAssignmentByIdFromDB,
  updateAssignmentToDB,
  deleteAssignmentFromDB,
  addmarksAndFeedbackToSubmission,
};
