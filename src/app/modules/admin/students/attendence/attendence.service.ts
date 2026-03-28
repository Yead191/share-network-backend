import mongoose, { Types } from "mongoose";
import { ClassAttendance } from "./attendance.model";
import { IClassAttendance } from "./attendance.interface";
import ApiError from "../../../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { query } from 'express';
import QueryBuilder from "../../../../../shared/apiFeature";
import { group } from "console";
// const getDayRange = (dateStr?: string | Date) => {
//     const targetDate = dateStr ? new Date(dateStr) : new Date(); // today if not passed

//     if (isNaN(targetDate.getTime())) {
//         throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Date Format. Use YYYY-MM-DD");
//     }

//     const start = new Date(targetDate);
//     start.setUTCHours(0, 0, 0, 0);

//     const end = new Date(targetDate);
//     end.setUTCHours(23, 59, 59, 999);

//     return { start, end };
// };

const getDayRange = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const end   = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    
    return { start, end };
};

const saveBatchAttendanceInDB = async (payload: IClassAttendance) => {
    const targetDate = new Date(payload.date);
    const start = new Date(targetDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setUTCHours(23, 59, 59, 999);

    const result = await ClassAttendance.findOneAndUpdate(
        { 
            groupId: payload.groupId, 
            date: { $gte: start, $lte: end } 
        },
        {
            $set: {
                date: start,
                groupId: payload.groupId,
                takenBy: payload.takenBy,
                records: payload.records
            }
        },
        { 
            new: true,  
            upsert: true, 
            runValidators: true
        }
    );

    return result;
};


const updateSingleStudentStatus = async (
    dateStr: string,
    classId: string,
    studentId: string,
    status: string,
    note: string = ""
) => {
    const { start, end } = getDayRange(dateStr);
    const attendanceRecord = await ClassAttendance.findOne({
        groupId: classId,
        date: { $gte: start, $lte: end }
    });

    if (!attendanceRecord) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Attendance sheet not found...");
    }

    const studentExists = attendanceRecord.records.find(
        (r: any) => r.studentId.toString() === studentId
    );

    let result;
    if (studentExists) {
        result = await ClassAttendance.findOneAndUpdate(
            {
                _id: attendanceRecord._id,
                "records.studentId": studentId
            },
            {
                $set: {
                    "records.$.status": status,
                    "records.$.note": note
                }
            },
            { new: true }
        );
    } else {
        result = await ClassAttendance.findByIdAndUpdate(
            attendanceRecord._id,
            {
                $push: { records: { studentId, status, note } }
            },
            { new: true }
        );
    }

    return result;
};

const getAttendanceByDateAndClass = async (dateStr?: string, groupId?: string) => {
    const query: any = {};

    if (dateStr) {
        const { start, end } = getDayRange(dateStr);
        query.date = { $gte: start, $lte: end };
    }

    if (groupId) {
        query.groupId = groupId;
    }

    const result = await ClassAttendance.find(query)
        .populate({
            path: 'records.studentId',
            select: 'firstName lastName rollNumber profile email'
        })
        .populate({
            path: 'groupId',
            select: 'name'
        })
        .populate({
            path: 'takenBy',
            select: 'name email'
        })
        .sort({ date: -1 }); 

    return result;
};

const getStudentAttendanceStats = async (groupId: string, query: Record<string, any>) => {
    
    const pipeline: any[] = [
        { $match: { groupId: new Types.ObjectId(groupId) } },
        { $unwind: "$records" },
        { 
            $group: {
                _id: "$records.studentId",
                totalClasses: { $sum: 1 },
                presentCount: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
                absentCount: { $sum: { $cond: [{ $eq: ["$records.status", "absent"] }, 1, 0] } },
                lateCount: { $sum: { $cond: [{ $eq: ["$records.status", "late"] }, 1, 0] } },
                excusedCount: { $sum: { $cond: [{ $eq: ["$records.status", "excused"] }, 1, 0] } }
            }
        },
        { 
            $lookup: {
                from: "studentprofiles",
                localField: "_id",
                foreignField: "userId", 
                as: "studentDetails"
            }
        },
        { $unwind: { path: "$studentDetails", preserveNullAndEmptyArrays: true } },
        { 
            $lookup: {
                from: "users",
                localField: "_id",  
                foreignField: "_id",
                as: "userDetails"
            }
        },
        { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
        { 
            $project: {
                _id: 0,
                studentId: "$_id",
                name: { $ifNull: ["$userDetails.name", "Unknown Student"] },
                rollNumber: { $ifNull: ["$studentDetails.rollNumber", null] },
                image: { $ifNull: ["$userDetails.profile", null] },
                attendance: {
                    total: "$totalClasses",
                    present: "$presentCount",
                    absent: "$absentCount",
                    late: "$lateCount",
                    percentage: {
                        $cond: [
                            { $eq: ["$totalClasses", 0] },
                            0,
                            { $multiply: [{ $divide: [{ $add: ["$presentCount", "$lateCount"] }, "$totalClasses"] }, 100] }
                        ]
                    }
                }
            }
        }
    ];

    if (query.searchTerm) {
        pipeline.push({
            $match: {
                name: { $regex: query.searchTerm, $options: 'i' }
            }
        });
    }

    if (query.sort) {
        const sortField = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
        const sortOrder = query.sort.startsWith('-') ? -1 : 1;
        pipeline.push({ $sort: { [sortField]: sortOrder } });
    } else {
        pipeline.push({ $sort: { name: 1 } });
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });
    const totalResult = await ClassAttendance.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const stats = await ClassAttendance.aggregate(pipeline);

    return {
        data: stats,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};


const updateallAttendanceRecordsFromDB = async (attendanceId: string, records: any[]) => {
    const result = await ClassAttendance.findByIdAndUpdate(
        attendanceId,
        {
            $set: {
                records: records
            }
        },
        { new: true, runValidators: true }
    );
    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Attendance record not found");
    }

    return result;
}

const getstudentIdFromAttendance = async (studentId: string) => {
    const result = await ClassAttendance.findById(studentId).select('records.studentId');
    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Attendance record not found");
    }
    return result;
}

const getRecentAttendance = async (days: number = 3) => {

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result = await ClassAttendance.find({
        date: { $gte: startDate }
    })
    .populate('groupId', 'name') 
    .populate('takenBy', 'name email') 
    .populate('records.studentId', 'name rollNo') 
    .sort({ date: -1 }); 

    return result;
};


export const AttendanceService = {
    saveBatchAttendanceInDB,
    updateSingleStudentStatus,
    getAttendanceByDateAndClass,
    getStudentAttendanceStats,
    updateallAttendanceRecordsFromDB,
    getstudentIdFromAttendance,
    getRecentAttendance
};