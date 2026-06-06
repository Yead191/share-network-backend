import { IWeeklyReport } from "./report.interface";
import { WeeklyReport } from './report.model';
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../../errors/ApiError";
import QueryBuilder from "../../../../shared/apiFeature";
import { User } from "../../user/user.model";
import { Types } from "mongoose";
const createWeeklyReport = async (payload: IWeeklyReport): Promise<any> => {
    const report = await WeeklyReport.create(payload);
    return report;
};


const getStudentReportsFromDB = async (studentId: string) => {
    const result = await WeeklyReport.find({ studentId })
        .populate('studentId')
        .sort({ weekStartDate: -1 });

    return result;
};

// const getAllStudentReportsFromDB = async (query: Record<string, any>) => {
//     const queryData = { ...query };
//     const searchTerm = typeof queryData.searchTerm === 'string' ? queryData.searchTerm.trim() : '';

//     delete queryData.searchTerm;

//     const result = new QueryBuilder(WeeklyReport.find(), queryData)
//         .filter();

//     if (searchTerm) {
//         const reportSearchConditions: Record<string, any>[] = [
//             { achievedHardOutcomes: { $regex: searchTerm, $options: 'i' } },
//             { softSkillImprovements: { $regex: searchTerm, $options: 'i' } },
//             { comments: { $regex: searchTerm, $options: 'i' } },
//             { objectives: { $regex: searchTerm, $options: 'i' } },
//             { 'goalSheet.skillName': { $regex: searchTerm, $options: 'i' } },
//         ];

//         const matchedStudents = await User.find({
//             $or: [
//                 { firstName: { $regex: searchTerm, $options: 'i' } },
//                 { lastName: { $regex: searchTerm, $options: 'i' } },
//                 { email: { $regex: searchTerm, $options: 'i' } },
//             ],
//         }).select('_id');

//         const matchedStudentIds = matchedStudents.map((student) => student._id);
//         if (matchedStudentIds.length) {
//             reportSearchConditions.push({ studentId: { $in: matchedStudentIds } });
//         }

//         const existingQuery = result.queryModel.getQuery();
//         result.queryModel = result.queryModel.find({
//             $and: [existingQuery, { $or: reportSearchConditions }],
//         });
//     }

//     result.sort().paginate();

//     const reports = await result.queryModel
//         .populate('studentId')
//         .sort({ weekStartDate: -1 });

//     return { reports, pagination: await result.getPaginationInfo() };
// };

const getAllStudentReportsFromDB = async (
    query: Record<string, any>,
) => {
    const queryData = { ...query };

    const searchTerm =
        typeof queryData.searchTerm === 'string'
            ? queryData.searchTerm.trim()
            : '';

    const selectedGroup =
        typeof queryData.selectedGroup === 'string'
            ? queryData.selectedGroup.trim()
            : '';

    const startDate =
        typeof queryData.startDate === 'string'
            ? queryData.startDate.trim()
            : '';

    const endDate =
        typeof queryData.endDate === 'string'
            ? queryData.endDate.trim()
            : '';

    const page = Math.max(Number(queryData.page) || 1, 1);
    const parsedLimit = Number(queryData.limit);
    const limit = parsedLimit || 10;

    const filterConditions: Record<string, any> = {};

    // =========================
    // Group Filter
    // =========================
    if (selectedGroup) {
        if (!Types.ObjectId.isValid(selectedGroup)) {
            return {
                reports: [],
                pagination: {
                    total: 0,
                    totalPage: 1,
                    page,
                    limit,
                },
            };
        }

        const studentIds = await User.find({
            userGroup: new Types.ObjectId(selectedGroup),
        }).distinct('_id');

        if (!studentIds.length) {
            return {
                reports: [],
                pagination: {
                    total: 0,
                    totalPage: 1,
                    page,
                    limit,
                },
            };
        }

        filterConditions.studentId = {
            $in: studentIds,
        };
    }

    // =========================
    // Date Range Filter
    // =========================
    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filterConditions.weekStartDate = {
            $gte: start,
        };
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filterConditions.weekEndDate = {
            $lte: end,
        };
    }

    delete queryData.searchTerm;
    delete queryData.selectedGroup;
    delete queryData.startDate;
    delete queryData.endDate;

    const result = new QueryBuilder(
        WeeklyReport.find(filterConditions),
        queryData,
    ).filter();

    // =========================
    // Search
    // =========================
    if (searchTerm) {
        const reportSearchConditions: Record<string, any>[] = [
            { achievedHardOutcomes: { $regex: searchTerm, $options: 'i' } },
            { softSkillImprovements: { $regex: searchTerm, $options: 'i' } },

            { whatDidYouWorkOnThisWeek: { $regex: searchTerm, $options: 'i' } },
            { whatProgressDidTheStudentMake: { $regex: searchTerm, $options: 'i' } },
            { highLightAchivementsAndImprove: { $regex: searchTerm, $options: 'i' } },
            { planForNextWeek: { $regex: searchTerm, $options: 'i' } },

            { comments: { $regex: searchTerm, $options: 'i' } },
            { objectives: { $regex: searchTerm, $options: 'i' } },

            {
                'goalSheet.skillName': {
                    $regex: searchTerm,
                    $options: 'i',
                },
            },
        ];

        const matchedStudentIds = await User.find({
            $or: [
                { firstName: { $regex: searchTerm, $options: 'i' } },
                { lastName: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { name: { $regex: searchTerm, $options: 'i' } },
            ],
        }).distinct('_id');

        if (matchedStudentIds.length) {
            reportSearchConditions.push({
                studentId: {
                    $in: matchedStudentIds,
                },
            });
        }

        const existingQuery = result.queryModel.getQuery();

        result.queryModel = result.queryModel.find({
            $and: [
                existingQuery,
                {
                    $or: reportSearchConditions,
                },
            ],
        });
    }

    result.sort().paginate();

    const reports = await result.queryModel
        .populate({
            path: 'studentId',
        })
        .sort({ weekStartDate: -1 });

    const pagination = await result.getPaginationInfo();

    return {
        reports,
        pagination,
    };
};

const updateWeeklyReportInDB = async (id: string, payload: Partial<IWeeklyReport>): Promise<any> => {
    const result = await WeeklyReport.findByIdAndUpdate(
        id.trim(),
        payload,
        {
            new: true,
            runValidators: true
        }
    );
    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Weekly Report not found');
    }
    return result;
}

const deleteWeeklyReportFromDB = async (id: string): Promise<void> => {
    const cleanId = id.trim();
    const result = await WeeklyReport.findByIdAndDelete(cleanId);


    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Weekly Report not found');
    }
};


const getReportByStudentIdAndWeekRange = async (studentId: string) => {
    // .find() returns an array [], whereas .findOne() returns an object {}
    const result = await WeeklyReport.find({
        studentId,
    })
        .populate('studentId', 'firstName lastName _id ')
        .sort({ createdAt: -1 });

    return result;
};

export const WeeklyReportService = {
    createWeeklyReport,
    getStudentReportsFromDB,
    getAllStudentReportsFromDB,
    deleteWeeklyReportFromDB,
    updateWeeklyReportInDB,
    getReportByStudentIdAndWeekRange,
};
