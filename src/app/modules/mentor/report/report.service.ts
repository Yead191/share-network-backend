import { IWeeklyReport } from "./report.interface";
import { WeeklyReport } from './report.model';
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../../errors/ApiError";
import QueryBuilder from "../../../../shared/apiFeature";
import { User } from "../../user/user.model";
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

const getAllStudentReportsFromDB = async (query: Record<string, any>) => {
    const queryData = { ...query };
    const searchTerm = typeof queryData.searchTerm === 'string' ? queryData.searchTerm.trim() : '';

    delete queryData.searchTerm;

    const result = new QueryBuilder(WeeklyReport.find(), queryData)
        .filter();

    if (searchTerm) {
        const reportSearchConditions: Record<string, any>[] = [
            { achievedHardOutcomes: { $regex: searchTerm, $options: 'i' } },
            { softSkillImprovements: { $regex: searchTerm, $options: 'i' } },
            { comments: { $regex: searchTerm, $options: 'i' } },
            { objectives: { $regex: searchTerm, $options: 'i' } },
            { 'goalSheet.skillName': { $regex: searchTerm, $options: 'i' } },
        ];

        const matchedStudents = await User.find({
            $or: [
                { firstName: { $regex: searchTerm, $options: 'i' } },
                { lastName: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
            ],
        }).select('_id');

        const matchedStudentIds = matchedStudents.map((student) => student._id);
        if (matchedStudentIds.length) {
            reportSearchConditions.push({ studentId: { $in: matchedStudentIds } });
        }

        const existingQuery = result.queryModel.getQuery();
        result.queryModel = result.queryModel.find({
            $and: [existingQuery, { $or: reportSearchConditions }],
        });
    }

    result.sort().paginate();

    const reports = await result.queryModel
        .populate('studentId')
        .sort({ weekStartDate: -1 });

    return { reports, pagination: await result.getPaginationInfo() };
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
