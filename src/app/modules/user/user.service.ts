import { USER_ROLES } from "../../../enums/user";
import { IUser } from "./user.interface";
import { JwtPayload } from "jsonwebtoken";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import generateOTP from "../../../util/generateOTP";
import { emailTemplate } from "../../../shared/emailTemplate";
import { emailHelper } from "../../../helpers/emailHelper";
import unlinkFile from "../../../shared/unlinkFile";
import { Reservation } from "../reservation/reservation.model";
import { sendTwilioOTP } from "../../../helpers/twillo";
import { formatPhoneNumber } from "../../../helpers/formatedPhoneNumber";
import { AppError } from "../../../errors/error.app";
import path from "path";
import { Types } from "mongoose";
import { UserGroupTrack } from "../user-group/user-group-track/user-group-track.model";

const createAdminToDB = async (payload: any): Promise<IUser> => {
  // check admin is exist or not;
  const isExistAdmin = await User.findOne({ email: payload.email });
  if (isExistAdmin) {
    throw new ApiError(StatusCodes.CONFLICT, "This Email already taken");
  }

  // create admin to db
  const createAdmin = await User.create(payload);
  if (!createAdmin) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create Admin");
  } else {
    await User.findByIdAndUpdate(
      { _id: createAdmin?._id },
      { verified: true, status: "ACTIVE" },
      { new: true },
    );
  }

  return createAdmin;
};

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create user");
  }

  console.log(createUser);

  const otp = generateOTP();
  const values = {
    name: createUser.name,
    otp: otp,
    email: createUser.email!,
  };
  console.log("Generated OTP:", otp);
  const createAccountTemplate = emailTemplate.createAccount(values);

  // Send email in background process to prevent crashes

  emailHelper.sendEmail(createAccountTemplate);

  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate(
    { _id: createUser._id },
    { $set: { authentication } },
  );

  return createUser;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>,
): Promise<Partial<IUser | null>> => {
  const { id } = user;

  const existingUser = await User.isExistUserById(id);
  if (!existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const fileFields = [
    "profile",
    "tradeLicences",
    "sallonPhoto",
    "proofOwnerId",
  ];
  console.log("Existing user data before update:", existingUser);
  for (const field of fileFields) {
    if (payload[field as keyof IUser] && existingUser[field as keyof IUser]) {
      try {
        unlinkFile(existingUser[field as keyof IUser] as string);
      } catch (error) {
        console.error(`Failed to unlink old ${field}:`, error);
      }
    }
  }

  const userToUpdate = await User.findById(id);
  if (!userToUpdate) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User not found for update!");
  }

  Object.assign(userToUpdate, payload);

  const updatedUser = await userToUpdate.save();

  const { password, ...userWithoutPassword } = updatedUser.toObject();

  return userWithoutPassword;
};

const updateLocationToDB = async (
  user: JwtPayload,
  payload: { longitude: number; latitude: number },
): Promise<IUser | null> => {
  const result = await User.findByIdAndUpdate(
    user.id,
    {
      $set: {
        "location.type": "Point",
        "location.coordinates": [payload.longitude, payload.latitude],
      },
    },
    { new: true },
  );

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Failed to update user location");
  }

  return result;
};

const updateprofileByIdToDB = async (
  id: string,
  payload: Partial<IUser>,
): Promise<Partial<IUser | null>> => {
  if (payload.userGroup) {
    const isUserGroupTrackExist = await UserGroupTrack.findOne({
      userGroup: payload.userGroup,
    });
    if (!isUserGroupTrackExist) {
      payload.userGroupTrack = null as any;
    }
  }
  const result = await User.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const getProfileFromDB = async (
  user: JwtPayload,
): Promise<Partial<IUser | null>> => {
  const { id } = user;

  const existingUser = await User.findById(id)
    .populate(
      "mentorId",
      "firstName lastName email profile contact location professionalTitle highestEducation havealaptop company jobTitle preferedGroup aviliableHours motivationLearning readBooks note careerDirections userGroup linkedInProfile githubProfile PortfolioWebsite PortfolioWebsite",
    )
    .populate({
      path: "assignedMentors",
      model: "User",
      select:
        "firstName lastName email profile contact location professionalTitle highestEducation havealaptop company jobTitle preferedGroup aviliableHours motivationLearning readBooks note careerDirections userGroup linkedInProfile githubProfile PortfolioWebsite PortfolioWebsite assignedStudents",
      populate: {
        path: "assignedStudents",
        select:
          "firstName lastName email profile contact location classId woop Goals review Onboarding",
        populate: [
          { path: "classId" },
          {
            path: "review.teacherId",
            select: "firstName lastName profile email",
          },
          {
            path: "Goals",
            model: "Goal",
          },
          {
            path: "Onboarding",
            model: "Onboarding",
          },
        ],
      },
    })
    .populate({
      path: "assignedStudents",
      select: `
        firstName 
        lastName 
        profile 
        email 
        contactNumber 
        about 
        location 
        classId 
        woop 
        Goals 
        review 
        Onboarding
      `,
      populate: [
        { path: "classId" },
        {
          path: "review.teacherId",
          select: "firstName lastName profile email",
        },
        {
          path: "Goals",
          model: "Goal",
        },
        {
          path: "Onboarding",
          model: "Onboarding",
        },
      ],
    })
    .populate({
      path: "woop",
      populate: {
        path: "goal",
      },
    })
    .populate("Goals", "title index description")
    .populate("userGroup", "name description")
    .populate("userGroupTrack", "name")
    .populate("Onboarding")
    .populate(
      "classId",
      "title description classDate location virtualClass published status userGroup userGroupTrack",
    )
    .lean();

  if (!existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return existingUser;
};

const getStudentsFromDB = async (mentorId: string) => {
  const result = await User.find({
    mentorId,
    role: USER_ROLES.STUDENT,
  }).populate("mentorId", "firstName lastName email profile contact location");

  return result;
};
const removeAssignedFromDB = async (mentorId: string, studentId: string) => {
  const mentor = await User.findById(mentorId);

  if (!mentor) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Mentor not found");
  }

  const updatedMentor = await User.findByIdAndUpdate(
    mentorId,
    {
      $pull: { assignedStudents: new Types.ObjectId(studentId) },
    },
    { new: true },
  );

  return updatedMentor;
};

const updateActivityFromDB = async (userId: string) => {
  const result = await User.findByIdAndUpdate(
    userId,
    {
      isOnline: true,
      lastSeen: new Date(),
    },
    { new: true },
  );
  return result;
};

export const UserService = {
  createUserToDB,
  updateProfileToDB,
  createAdminToDB,
  updateLocationToDB,
  getProfileFromDB,
  updateprofileByIdToDB,
  getStudentsFromDB,
  removeAssignedFromDB,
  updateActivityFromDB,
};
