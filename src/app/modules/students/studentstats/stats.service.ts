import mongoose, { Types } from "mongoose";
import { User } from "../../user/user.model";
import { Event } from "../../admin/event/event.model";
import { AssignmentsSub } from "../assignments/assignmentsSub.model";
import { Assignment } from "../../(teacher)/assignment/assignment.model";


const getMyStatsFromDB = async (userId: string) => {
  const result = await User.findById(userId)
    .populate('woop')
    .populate('Goals')
    .populate('mentorId')
    .populate('classId');

  if (!result) {
    throw new Error('Student profile not found for this user');
  }

  const totalSubmittedAssignments = await AssignmentsSub.countDocuments({
    studentId: result._id,
  });
  const totalPendingAssignments = await Assignment.countDocuments({
  published: true,
  status: 'PENDING',
  _id: { $nin: await Assignment.distinct('assignmentId', { submitAssignment: { $exists: true } }) },
});

  const countindividual = {
    totalSubmittedAssignments,
    totalPendingAssignments,
   totalClasses: result.classId ? 1 : 0,
   totalMentors: result.mentorId ? 1 : 0,

    totalGoals: result.Goals?.length || 0, 
    totalWoops: result.woop?.length || 0,
  };

  return countindividual;
};


const getUpcomingEventsFromDB = async (studentId: string | undefined, role: string | undefined) => {
  let finalFilter: any = {
    date: { $gte: new Date() } 
  };

  
  if (role !== 'SUPER_ADMIN') {
    const permissionFilter = {
      $or: [
        { studentAssigned: { $size: 0 } },     
        { studentAssigned: { $exists: false } } 
      ]
    };

    if (studentId) {
      permissionFilter.$or.push({ studentAssigned: new Types.ObjectId(studentId) } as any);
    }


    finalFilter = { $and: [finalFilter, permissionFilter] };
  }

  const upcomingEvents = await Event.find(finalFilter)
    .sort({ date: 1 }) 
    .limit(3)
    .populate("targetTrack") 
    .populate("targetGroup")
    .populate("studentAssigned")
    .exec();
  
  return {
    success: true,
    data: upcomingEvents || []
  };
};

const getPendingAssignmentsFromDB = async (studentId: string) => {
  const activeAssignments = await Assignment.find({ dueDate: { $gte: new Date() } })
    .sort({ dueDate: 1 })
    .limit(3)
    .select('title description dueDate submitAssignment status userGroup userGroupTrack totalPoint attachment teacher published ')
    .populate('teacher', 'firstName lastName email profile')
    .populate('userGroup', 'name description')
    .populate('userGroupTrack', 'name')
    .lean();
  
  return activeAssignments;
};



export const StudentStatsService = {
  getMyStatsFromDB,
    getUpcomingEventsFromDB,
    getPendingAssignmentsFromDB
}