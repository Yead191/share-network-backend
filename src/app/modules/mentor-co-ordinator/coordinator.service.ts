import { StatusCodes } from "http-status-codes";
import { USER_ROLES } from "../../../enums/user";
import ApiError from "../../../errors/ApiError";
import { LearningMaterial } from "../mentor/lmetarial/learning.model";
import { UserGroupTrack } from "../user-group/user-group-track/user-group-track.model";
import { UserGroup } from "../user-group/user-group.model";
import { User } from "../user/user.model";
import { Class } from "../(teacher)/class/class.model";
import QueryBuilder from "../../../shared/apiFeature";
import { Types } from "mongoose";

const getDashboardStats = async () => {
    const totalMentors = await User.countDocuments({ role: USER_ROLES.MENTOR });
    const totalStudents = await User.countDocuments({ role: USER_ROLES.STUDENT });
    const totalLearningMaterials = await LearningMaterial.countDocuments();
    const totalGroups = await UserGroup.countDocuments();
    const totalTracks = await UserGroupTrack.countDocuments();

    return {
        totalMentors,
        totalStudents,
        totalLearningMaterials,
        totalGroups,
        totalTracks
    };
}

const getAllMentorsFromDB = async (query: Record<string, unknown>) => {
  const cleanQuery: Record<string, unknown> = Object.fromEntries(
    Object.entries(query).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
  );

    const page = Math.max(Number(cleanQuery.page) || 1, 1);
    const parsedLimit = Number(cleanQuery.limit);
    const limit = cleanQuery.limit !== undefined && parsedLimit === 0 ? 0 : parsedLimit || 10;

    const baseConditions: Record<string, any> = { role: USER_ROLES.MENTOR };

    if (cleanQuery.userGroup) {
        const rawGroupIds = Array.isArray(cleanQuery.userGroup)
            ? cleanQuery.userGroup
            : String(cleanQuery.userGroup).split(',').map((value) => value.trim()).filter(Boolean);

        const validGroupIds = rawGroupIds.filter((id) => Types.ObjectId.isValid(String(id)));
        if (!validGroupIds.length) {
            return { mentors: [], pagination: { total: 0, totalPage: 1, page, limit } };
        }

        baseConditions.userGroup = {
            $in: validGroupIds.map((id) => new Types.ObjectId(String(id))),
        };

        delete cleanQuery.userGroup;
    }

  if (cleanQuery.status) {
    cleanQuery.verified = cleanQuery.status === "Active" ? true : false;
    delete cleanQuery.status; 
  }

  const mentorQuery = new QueryBuilder(
        User.find(baseConditions),
    cleanQuery
  )
    .search(['name', 'firstName', 'lastName', 'email'])
    .filter()
    .sort()
    .paginate();

  const mentorsData = await mentorQuery.queryModel
    .populate('userGroup')
    .populate('assignedStudents');
  const pagination = await mentorQuery.getPaginationInfo();

  return { mentors: mentorsData, pagination };
};

const getMentorById = async (id: string) => {
    const mentor = await User.findById(id)
    .populate('userGroup');
    if (!mentor || mentor.role !== USER_ROLES.MENTOR) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Mentor not found');
    }
    return mentor;
};

const updateMentorStatusFromDB = async (id: string, status: boolean) => {
    const mentor = await User.findByIdAndUpdate(id, { isActive: status }, { new: true });
    if (!mentor || mentor.role !== USER_ROLES.MENTOR) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Mentor not found');
    }
    return mentor;
};

const getAllClassesFromDB = async (query: Record<string, unknown>) => {
    const cleanQuery: Record<string, unknown> = Object.fromEntries(
        Object.entries(query).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
    );

    const filterConditions: Record<string, any> = {};

    if (cleanQuery.userGroup) {
        const rawGroupIds = Array.isArray(cleanQuery.userGroup)
            ? cleanQuery.userGroup
            : String(cleanQuery.userGroup).split(',').map((value) => value.trim()).filter(Boolean);

        const validGroupIds = rawGroupIds.filter((id) => Types.ObjectId.isValid(String(id)));

        if (!validGroupIds.length) {
            return [];
        }

        filterConditions.userGroup = {
            $in: validGroupIds.map((id) => new Types.ObjectId(String(id))),
        };
    }

    const classes = await Class.find(filterConditions)
    .populate({ path: 'teacher', select: 'name' })
    .populate({ path: 'userGroup', select: 'name' })
    .populate({ path: 'userGroupTrack', select: 'name' });
    return classes;
};

const getClassByIdFromDB = async (id: string) => {
    const classInfo = await Class.findById(id)
    .populate({ path: 'teacher', select: 'name' })
    .populate({ path: 'userGroup', select: 'name' })
    .populate({ path: 'userGroupTrack', select: 'name' });
    if (!classInfo) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Class not found');
    }
    return classInfo;
};

const updateClassStatusFromDB = async (id: string) => {
    const classInfo = await Class.findById(id);

    if (!classInfo) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Resource not found');
    }

    const updatedClass = await Class.findByIdAndUpdate(
        id,
        { status: !classInfo.status },
        { new: true }
    );

    return updatedClass;
};


const getAllResourcesFromDB = async (query: Record<string, any>) => {
    const material = new QueryBuilder(LearningMaterial.find(), query)
    .search(['title', 'description', 'type', 'contentUrl'])
    .filter()
    .sort()
    .paginate();

    const resources = await material.queryModel
    .populate({ path: 'createdBy', select: 'name' })
    .populate({ path: 'targeteAudience', select: 'name' })
    .populate({ path: 'targertGroup', select: 'name' });

    const pagination = await material.getPaginationInfo();

    return { resources, pagination };
};

const getResourceByIdFromDB = async (id: string) => {
    const material = await LearningMaterial.findById(id)
    .populate({ path: 'createdBy', select: 'name' })
    .populate({ path: 'targeteAudience', select: 'name' })
    .populate({ path: 'targertGroup', select: 'name' });
    if (!material) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Resource not found');
    }
    return material;
};

const updateResourceStatusFromDB = async (id: string) => {
    const material = await LearningMaterial.findById(id);

    if (!material) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Resource not found');
    }

    const updatedMaterial = await LearningMaterial.findByIdAndUpdate(
        id,
        { markAsAssigned: !material.markAsAssigned },
        { new: true }
    );

    return updatedMaterial;
};

const getlastFIveAdedStudentsFromDB = async () => {
    const students = await User.find({ role: USER_ROLES.STUDENT })
    .populate('userGroup')
    .populate('userGroupTrack')
    .sort({ createdAt: -1 })
    .limit(5);
    return students;
};

const lastThreeResourcesFromDB = async () => {
    const resources = await LearningMaterial.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .populate({ path: 'createdBy', select: 'name' })
    .populate({ path: 'targeteAudience', select: 'name' })
    .populate({ path: 'targertGroup', select: 'name' });
    return resources;
};

export const CoordinatorService = {
    getDashboardStats,
    getAllMentorsFromDB,
    getMentorById,
    updateMentorStatusFromDB,
    getAllClassesFromDB,
    getClassByIdFromDB,
    updateClassStatusFromDB,
    getAllResourcesFromDB,
    getResourceByIdFromDB,
    updateResourceStatusFromDB,
    getlastFIveAdedStudentsFromDB,
    lastThreeResourcesFromDB
}