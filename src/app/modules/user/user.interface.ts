import mongoose, { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
import { IUserGroup } from '../user-group/user-group.interface';
import { IUserGroupTrack } from '../user-group/user-group-track/user-group-track.interface';
import { Portfolio } from '../portfolio/portfolio.model';
import { IClass } from '../(teacher)/class/class.interface';
import { Onboarding } from '../admin/onboarding/onboarding.model';

interface IStripeAccountInfo {
    status?: boolean;
    accountId?: string;
    externalAccountId?: string;
    accountUrl?: string;
    currency?: string;
}

interface IAuthenticationProps {
    isResetPassword: boolean;
    oneTimeCode: string;
    expireAt: Date;
}
export type IUser = {
    [x: string]: any;
    _id: any;
    firstName: string;
    lastName: string;
    appId?: string;
    role: USER_ROLES;
    contactNumber?: string;
    mobileNumber?: string;
    assignedStudents?: (mongoose.Types.ObjectId | IUser)[];
    vNumber?: string;
    email?: string;
    professionalTitle?: string;
    highestEducation?: string;
    havealaptop?: boolean;
    company: string;
    jobTitle: string;
    preferedGroup: string;
    aviliableHours: string;
    motivationLearning: string;
    readBooks: string;
    review: [{
        rating: number;
        comment: string;
        courseCompletion: number;
    }];
    isOnline: boolean;
    lastSeen: Date;
    note: string;
    careerDirections: string[];
    Onboarding?: mongoose.Types.ObjectId | typeof Onboarding;
    password: string;
    confirmPassword?: string;
    location: {};
    address:string
    about:string
    dateOfBirth:string;
    gender: "Male" | "Female" | "Children" | "Others";
    profile: string;
    linkedInProfile?: string;
    githubProfile?: string;
    PortfolioWebsite?:string;
    mentorId?: mongoose.Types.ObjectId | IUser;
    woop?: (mongoose.Types.ObjectId | any)[];
    Goals?: (mongoose.Types.ObjectId | any)[];
    classId?: mongoose.Types.ObjectId | IClass;
    isUpdate: boolean;
    verified: boolean;
    discount?: number;
    deviceToken?: string;
    // authentication?: IAuthenticationProps;
    // authentication: IAuthenticationProps;
    authentication: {
        isResetPassword: boolean;
        oneTimeCode: string;
        expireAt: Date;
    };
    accountInformation?: IStripeAccountInfo;
    userGroup?: (mongoose.Types.ObjectId | IUserGroup)[];
    userGroupTrack?: mongoose.Types.ObjectId | IUserGroupTrack;
    assignedMentors?: (mongoose.Types.ObjectId | IUser)[];
}

export type UserModal = {
    isExistUserById(id: string): any;
    isExistUserByEmail(email: string): any;
    isAccountCreated(id: string): any;
    isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;