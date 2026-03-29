import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { IUser } from '../../user/user.interface';
import { User } from '../../user/user.model';
import { Reservation } from '../../reservation/reservation.model';
import QueryBuilder from '../../../../shared/apiFeature';
import { Event } from '../event/event.model';
import { LearningMaterial } from '../../mentor/lmetarial/learning.model';
import { Assignment } from '../../(teacher)/assignment/assignment.model';
import { UserGroup } from '../../user-group/user-group.model';
import { UserGroupTrack } from '../../user-group/user-group-track/user-group-track.model';
import { Class } from '../../(teacher)/class/class.model';
import { Types } from 'mongoose';

const createAdminToDB = async (payload: IUser): Promise<IUser> => {
    payload.verified = true;
    const createAdmin: any = await User.create(payload);
    if (!createAdmin) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Admin');
    }
    return createAdmin;
};

const deleteAdminFromDB = async (id: any): Promise<IUser | undefined> => {
    const isExistAdmin = await User.findByIdAndDelete(id);
    if (!isExistAdmin) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to delete Admin');
    }
    return;
};

const getAdminFromDB = async (): Promise<IUser[]> => {
    const admins = await User.find({ role: 'ADMIN' })
        .select('name email profile contact location');
    return admins;
};

const getTotalUsersByRoleFromDB = async (): Promise<{ totalStudents: number; totalTeachers: number; totalMentors: number; totalCoordinators: number; total: number }> => {
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const totalTeachers = await User.countDocuments({ role: 'TEACHER' });
    const totalMentors = await User.countDocuments({ role: 'MENTOR' });
    const totalCoordinators = await User.countDocuments({ role: 'COORDINATOR' });

    const total = totalStudents + totalTeachers + totalMentors + totalCoordinators;

    return {
        totalStudents,
        totalTeachers,
        totalMentors,
        totalCoordinators,
        total,
    };
};


const getRecentActivitiesFromDB = async () => {

    const [events, resources, assignments] = await Promise.all([
        Event.find()
            .sort({ createdAt: -1 })
            .limit(2)
            .select('title createdAt')
            .lean(),

        LearningMaterial.find()
            .sort({ createdAt: -1 })
            .limit(2)
            .select('title createdAt')
            .lean(),

        Assignment.find()
            .sort({ createdAt: -1 })
            .limit(2)
            .select('title createdAt')
            .lean(),
    ]);

    const formattedEvents = events.map(item => ({
        ...item,
        activityType: 'event'
    }));

    const formattedResources = resources.map(item => ({
        ...item,
        activityType: 'resource'
    }));

    const formattedAssignments = assignments.map(item => ({
        ...item,
        activityType: 'assignment'
    }));

    const allActivities = [
        ...formattedEvents,
        ...formattedResources,
        ...formattedAssignments
    ];

allActivities.sort((a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

    return allActivities;
};
const getAllCoordinatorFromDB = async (query: Record<string, any>) => {
    const queryData = { ...query };
    const searchTerm = typeof queryData.searchTerm === 'string' ? queryData.searchTerm.trim() : '';
    const requestedUserGroup = queryData.userGroup;
    const requestedUserGroupTrack = queryData.userGroupTrack;
    const requestedClassId = queryData.classId;

    const page = Math.max(Number(queryData.page) || 1, 1);
    const parsedLimit = Number(queryData.limit);
    const limit = queryData.limit !== undefined && parsedLimit === 0 ? 0 : parsedLimit || 10;

    delete queryData.searchTerm;
    delete queryData.userGroup;
    delete queryData.userGroupTrack;
    delete queryData.classId;

    const baseConditions: Record<string, any> = { role: 'COORDINATOR' };

    if (requestedUserGroup) {
        const rawGroupIds = Array.isArray(requestedUserGroup)
            ? requestedUserGroup
            : String(requestedUserGroup).split(',').map((value) => value.trim()).filter(Boolean);

        const validGroupIds = rawGroupIds.filter((id) => Types.ObjectId.isValid(id));
        if (!validGroupIds.length) {
            return { data: [], pagination: { total: 0, totalPage: 1, page, limit } };
        }

        baseConditions.userGroup = { $in: validGroupIds.map((id) => new Types.ObjectId(id)) };
    }

    if (requestedUserGroupTrack) {
        const groupTrackId = String(requestedUserGroupTrack).trim();
        if (!Types.ObjectId.isValid(groupTrackId)) {
            return { data: [], pagination: { total: 0, totalPage: 1, page, limit } };
        }

        baseConditions.userGroupTrack = new Types.ObjectId(groupTrackId);
    }

    if (requestedClassId) {
        const rawClassIds = Array.isArray(requestedClassId)
            ? requestedClassId
            : String(requestedClassId).split(',').map((value) => value.trim()).filter(Boolean);

        const validClassIds = rawClassIds.filter((id) => Types.ObjectId.isValid(id));
        if (!validClassIds.length) {
            return { data: [], pagination: { total: 0, totalPage: 1, page, limit } };
        }

        baseConditions.classId = { $in: validClassIds.map((id) => new Types.ObjectId(id)) };
    }

  const queryBuilder = new QueryBuilder(
        User.find(baseConditions),
        queryData
  )
    .filter()
    .sort()
    .paginate();

    if (searchTerm) {
        const searchConditions: Record<string, any>[] = [
            { firstName: { $regex: searchTerm, $options: 'i' } },
            { lastName: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { contactNumber: { $regex: searchTerm, $options: 'i' } },
            { mobileNumber: { $regex: searchTerm, $options: 'i' } },
        ];

        const [matchedGroups, matchedTracks, matchedClasses] = await Promise.all([
            UserGroup.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
            UserGroupTrack.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id').lean(),
            Class.find({
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { location: { $regex: searchTerm, $options: 'i' } },
                ],
            }).select('_id').lean(),
        ]);

        const matchedGroupIds = matchedGroups.map((group) => group._id);
        const matchedTrackIds = matchedTracks.map((track) => track._id);
        const matchedClassIds = matchedClasses.map((item) => item._id);

        if (matchedGroupIds.length) {
            searchConditions.push({ userGroup: { $in: matchedGroupIds } });
        }

        if (matchedTrackIds.length) {
            searchConditions.push({ userGroupTrack: { $in: matchedTrackIds } });
        }

        if (matchedClassIds.length) {
            searchConditions.push({ classId: { $in: matchedClassIds } });
        }

        const existingQuery = queryBuilder.queryModel.getQuery();
        queryBuilder.queryModel = queryBuilder.queryModel.find({
            $and: [existingQuery, { $or: searchConditions }],
        });
    }

const result = await queryBuilder.queryModel
  .populate('mentorId', 'firstName lastName email profile contact location')
  .populate('assignedMentors', 'firstName lastName email profile contact location')
  .populate('woop', 'title')
  .populate('Goals', 'title index description')
  .populate({
    path: 'classId',
    select: 'title description classDate location virtualClass published status',
    populate: [
      { path: 'userGroup', select: 'name description', model: 'UserGroup' },
      { path: 'userGroupTrack', select: 'name description', model: 'UserGroupTrack' },
    ],
  })
  .populate({
    path: 'userGroup',
    select: 'name description',
    model: 'UserGroup',
  })
  .populate({
    path: 'userGroupTrack',
    select: 'name description',
    model: 'UserGroupTrack',
  })
  .exec();

  const pagination = await queryBuilder.getPaginationInfo();

  return { data: result, pagination };
};



export const AdminService = {
    createAdminToDB,
    deleteAdminFromDB,
    getAdminFromDB,
    getTotalUsersByRoleFromDB,
    getRecentActivitiesFromDB,
    getAllCoordinatorFromDB
};
