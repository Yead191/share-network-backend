import { model, Schema } from "mongoose";
import { USER_ROLES } from "../../../enums/user";
import { IUser, UserModal } from "./user.interface";
import bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";
import { Goal } from '../admin/goal/goal.model';
import { Onboarding } from '../admin/onboarding/onboarding.model';

const userSchema = new Schema<IUser, UserModal>(
  {
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    contactNumber: {
      type: String,
      required: false,
    },
    vNumber: {
      type: String,
      required: false,
    },
    appId: {
      type: String,
      required: false,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },

    email: {
      type: String,
      required: false,
      unique: false,
      immutable: true,
      lowercase: true,
    },

    mobileNumber: {
      type: String,
      required: false,
      unique: false,
    },

    password: {
      type: String,
      required: false,
      select: 0, // Password is not required for OTP-based login
    },

    confirmPassword: {
      type: String,
      required: false,
      select: 0,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
      },
    },

    profile: {
      type: String,
      default:
        "https://res.cloudinary.com/ddqovbzxy/image/upload/v1736572642/avatar_ziy9mp.jpg",
    },
    professionalTitle: {
      type: String,
      required: false,
    },
 

    highestEducation: {
      type: String,
      required: false,
    },
 
    department: {
        type: String,
        trim: true
    },
    rollNumber: {
        type: Number
    },
    havealaptop: {
      type: Boolean,
      required: false,
    },
    company: {
      type: String,
      required: false,
    },
    jobTitle: {
      type: String,
      required: false,
    },
    preferedGroup: {
      type: String,
      required: false,
    },
    aviliableHours: {
      type: String,
      required: false,
    },
    linkedInProfile: {
      type: String,
      required: false,
    },
    githubProfile: {
      type: String,
      required: false,
    },
    PortfolioWebsite: {
      type: String,
      required: false,
    },
    motivationLearning: {
      type: String,
      required: false,
    },
    readBooks: {
      type: String,
      required: false,
    },
    note: {
      type: String,
      required: false,
    },
    review: [
      {
        teacherNote: {
          type: String,
          required: false,
        },
        teacherId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        rating: {
          type: Number,
          required: false,
        },
        courseCompletion: {
          type: Number,
          required: false,
        },
      },
    ],
  Onboarding: {
        type: Schema.Types.ObjectId,
        ref: "Onboarding",
    },

  careerDirections: {
        type: [String],
        required: [true, "Career directions are required"],
        default: []
    },
    isUpdate: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },


    about: {
      type: String,
      required: false,
    },

    address: {
      type: String,
      required: false,
    },

    dateOfBirth: {
      type: String,
      required: false,
    },
    userGroup: [
      {
        type: Schema.Types.ObjectId,
        ref: "UserGroup",
      },
    ],
    userGroupTrack: {
      type: Schema.Types.ObjectId,
      ref: "UserGroupTrack",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Children", "Others"],
      required: false,
    },
    woop: [
      {
        type: Schema.Types.ObjectId,
        ref: "WoopGoal",
      },
    ],
    Goals: [
      {
        type: Schema.Types.ObjectId,
        ref: "Goal",
      },
    ],
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    classId: [{
        type: Schema.Types.ObjectId,
        ref: 'Class', 
    }],
    assignedStudents: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: String,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
      },
      select: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "NON_ACTIVE","ALUMNI_GRADUATED"],
      default: "PENDING",
    },
    isOnline: {
    type: Boolean,
    default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },
    accountInformation: {
      status: { type: Boolean },
      accountId: { type: String },
      externalAccountId: { type: String },
      accountUrl: { type: String },
      currency: { type: String },
    },

    discount: {
      type: Number,
    },

    deviceToken: {
      type: String,
    },
    assignedMentors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

userSchema.index({ location: "2dsphere" });

userSchema.statics.isExistUserById = async function (id: string) {
    return await this.findById(id);
};

const mapOnlineStatus = (_doc: unknown, ret: Record<string, any>) => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const lastSeenTime = ret?.lastSeen ? new Date(ret.lastSeen).getTime() : 0;
  ret.isOnline = lastSeenTime > fiveMinutesAgo;
  return ret;
};

userSchema.set('toJSON', { virtuals: true, transform: mapOnlineStatus });
userSchema.set('toObject', { virtuals: true, transform: mapOnlineStatus });

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email });
  return isExist;
};

userSchema.statics.isExistUserByMobileNumber = async (mobileNumber: string) => {
  const isExist = await User.findOne({ mobileNumber });
  return isExist;
};

//account check
userSchema.statics.isAccountCreated = async (id: string) => {
  const isUserExist: any = await User.findById(id);
  return isUserExist.accountInformation.status;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

// Updated pre-save middleware
userSchema.pre("save", async function (next) {
  const user = this as IUser;

  if (this.isNew) {
    if (user.mobileNumber) {
      const existingUserByMobile = await User.findOne({
        mobileNumber: user.mobileNumber,
      });
      if (existingUserByMobile) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Mobile number already exists",
        );
      }
    }

    if (user.email) {
      const existingUserByEmail = await User.findOne({ email: user.email });
      if (existingUserByEmail) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Email already exists!");
      }
    }
  }

  if (user.role === USER_ROLES.MENTOR || user.role === USER_ROLES.STUDENT) {
    if (!user.accountInformation) {
      user.accountInformation = {
        status: false,
        accountId: "",          
        externalAccountId: "",
        accountUrl: "",
        currency: ""
      };
    }
    if (user.discount === undefined) user.discount = 0;
    if (!user.about) user.about = "";
    if (user.isSubscribed === undefined) user.isSubscribed = false;
  }

  if (!user.isModified('password')) {
      return next();
  }

  if (user.password) {
      user.password = await bcrypt.hash(
        user.password,
        Number(config.bcrypt_salt_rounds),
      );
  }

  next();
});

export const User = model<IUser, UserModal>("User", userSchema);
