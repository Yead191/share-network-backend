import QueryBuilder from "../../../../shared/apiFeature";
import { IWoopGoal } from "./woops.interface";
import { WoopGoal } from "./woops.model";
import { query } from 'winston';


const createwoopFromDB = async (payload: IWoopGoal) => {
    const woop = await WoopGoal.create(payload);
    if (!woop) {
        throw new Error('Failed to create WOOP goal');
    }
    return woop;
}


const getUserWoopsFromDB = async (
    userId: string,
    role: string,
    query: Record<string, any>
) => {
    const filter: Record<string, any> = {};

    if (role === 'MENTOR') {
        filter.mentorId = userId;
    } else if (role === 'STUDENT') {
        filter.studentId = userId;
    }

    let mongoQuery = WoopGoal.find(filter).populate(
        'studentId',
        'firstName lastName profile'
    ).populate(
        'mentorId',
        'firstName lastName profile'
    )

    const queryBuilder = new QueryBuilder(mongoQuery, query).sort().paginate();
    const result = await queryBuilder.queryModel;
    const pagination = await queryBuilder.getPaginationInfo();
    return { data: result, pagination };
};
const getWoopByIdFromDB = async (id: string) => {
    const result = await WoopGoal.findById(id)
        .populate('studentId')
        .populate('mentorId')
        .populate('goal')
        .sort({ createdAt: -1 });

    if (!result) {
        throw new Error('WOOP goal not found');
    }

    return result;
};

const getAllUserWoopsFromDB = async (query: Record<string, any>) => {
    const queryBuilder = new QueryBuilder(
        WoopGoal.find().populate('studentId').populate('mentorId').populate('goal').sort({ createdAt: -1 }),
        query
    )
        .search(['studentId', 'mentorId', 'goal', 'status'])
        .filter()
        .sort()
        .paginate();

    const result = await queryBuilder.queryModel.exec();

    const pagination = await queryBuilder.getPaginationInfo();

    return { data: result, pagination };
};
const getWoopsIdsFromDB = async (ids: string[]) => {
    const objectIds = ids.map(id => id.trim());
    const result = await WoopGoal.find({ _id: { $in: objectIds } })
        .populate('userId')
        .populate('goal')
        .sort({ createdAt: -1 });

    return result;
}

const updateWoopFromDB = async (id: string, payload: IWoopGoal) => {
    const result = await WoopGoal.findByIdAndUpdate(
        id, payload,
        {
            new: true,
            runValidators: true
        }
    );
    return result;
};

const deleteWoopFromDB = async (id: string) => {
    const cleanId = id.trim();
    const result = await WoopGoal.findByIdAndDelete(cleanId);

    if (!result) {
        throw new Error('WOOP goal not found');
    }
}

export const WoopService = {
    createwoopFromDB,
    getUserWoopsFromDB,
    getWoopByIdFromDB,
    getAllUserWoopsFromDB,
    updateWoopFromDB,
    deleteWoopFromDB,
    getWoopsIdsFromDB
};