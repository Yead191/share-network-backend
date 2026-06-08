import catchAsync from "../../../../shared/catchAsync";
import { User } from "../../user/user.model";
import { WoopService } from "./woops.service";


const createwoop = catchAsync(async (req, res) => {
    // console.log(req?.user)
    const woopData = req.body;
    const userId = req.user.id;
    woopData.mentorId = userId;
    // woopData.studentId = req.body.studentId;
    const mentor = await User.findById(userId).select('assignedStudents').populate({
        path: "assignedStudents",
        select: "_id"
    })
    // console.log(mentor);
    woopData.studentId = mentor?.assignedStudents?.[0]?._id;
    const newWoop = await WoopService.createwoopFromDB(woopData);
    res.status(201).json({
        success: true,
        data: newWoop,
    });
});

const getUserWoops = catchAsync(async (req, res) => {
    const { id, role } = req.user.id;
    const woops = await WoopService.getUserWoopsFromDB(id, role, req.query);
    res.status(200).json({
        success: true,
        data: woops.data,
        pagination: woops.pagination
    });
});
const getAllWoops = catchAsync(async (req, res) => {
    const woops = await WoopService.getAllUserWoopsFromDB(req.query);
    res.status(200).json({
        success: true,
        data: woops,
    });
});

const updateWoop = catchAsync(async (req, res) => {
    const id = req.params.id;
    const updateData = req.body;
    const updatedWoop = await WoopService.updateWoopFromDB(id, updateData);
    res.status(200).json({
        success: true,
        data: updatedWoop,
    });
});

const deleteWoop = catchAsync(async (req, res) => {
    const id = req.params.id;
    await WoopService.deleteWoopFromDB(id);
    res.status(200).json({
        success: true,
        message: 'WOOP goal deleted successfully',
    });
});

const getWoopById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const woop = await WoopService.getWoopByIdFromDB(id);
    res.status(200).json({
        success: true,
        data: woop,
    });
});

export const mentorWoops = {
    createwoop,
    getUserWoops,
    getAllWoops,
    getWoopById,
    updateWoop,
    deleteWoop,

};