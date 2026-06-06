import mongoose, { SortOrder, Types } from 'mongoose';
import { StudentProfile } from './students.model';
import { IStudentProfile, IStudentReview } from './students.interface';
import { User } from '../../../user/user.model';
import QueryBuilder from '../../../../../shared/apiFeature';
import { UserGroupTrack } from '../../../user-group/user-group-track/user-group-track.model';
import { UserGroup } from '../../../user-group/user-group.model';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../../errors/ApiError';

const createStudentIntoDB = async (payload: IStudentProfile) => {
  const result = await StudentProfile.create(payload);
  return result;
};


const getAllStudentsFromDB = async (query: Record<string, any>) => {
  const { userGroup, userGroupTrack, ...restQuery } = query;

  const baseFilter: Record<string, any> = { role: 'STUDENT' };

  if (userGroup) {
    if (!Types.ObjectId.isValid(userGroup)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid userGroup ID');
    }
    baseFilter.userGroup = new Types.ObjectId(userGroup);
  }

  if (userGroupTrack) {
    if (!Types.ObjectId.isValid(userGroupTrack)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid userGroupTrack ID');
    }
    baseFilter.userGroupTrack = new Types.ObjectId(userGroupTrack);
  }

  const queryBuilder = new QueryBuilder(
    User.find(baseFilter),
    restQuery
  )
    .search([
      'studentId', 'department', 'group', 'track',
      'location', 'email', 'firstName', 'lastName', 'status'

    ])
    .filter()
    .sort()
    .paginate();

  const result = await queryBuilder.queryModel
    .populate('mentorId', 'firstName lastName email profile contact location')
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
    .populate({ path: 'userGroup', select: 'name description', model: 'UserGroup' })
    .populate({ path: 'userGroupTrack', select: 'name description', model: 'UserGroupTrack' })
    .exec();

  const pagination = await queryBuilder.getPaginationInfo();
  return { data: result, pagination };
};

// const getStudentsForTeacherFromDB = async (query: Record<string, any>) => {
//   const queryData = { ...query };
//   const searchTerm = typeof queryData.searchTerm === 'string' ? queryData.searchTerm.trim() : '';
//   const page = Math.max(Number(queryData.page) || 1, 1);
//   const parsedLimit = Number(queryData.limit);
//   const limit = queryData.limit !== undefined && parsedLimit === 0 ? 0 : parsedLimit || 10;

//   const baseFilter: Record<string, any> = { role: 'STUDENT' };
//   delete queryData.searchTerm;
//   if (queryData.userGroup) {
//     const userGroupValues = Array.isArray(queryData.userGroup)
//       ? queryData.userGroup
//       : String(queryData.userGroup).split(',').map((value) => value.trim()).filter(Boolean);

//     const validUserGroupIds = userGroupValues.filter((id) => Types.ObjectId.isValid(id));
//     if (!validUserGroupIds.length) {
//       return { pagination: { total: 0, totalPage: 1, page, limit }, classes: [] };
//     }
//     filterConditions.userGroup = { $in: validUserGroupIds.map((id) => new Types.ObjectId(id)) };
//   }
//   delete queryData.userGroup;
//   delete queryData.userGroupTrack;

//   if (queryData.userGroupTrack) {
//     const userGroupTrackId = String(queryData.userGroupTrack).trim();
//     if (!Types.ObjectId.isValid(userGroupTrackId)) {
//       return { pagination: { total: 0, totalPage: 1, page, limit }, classes: [] };
//     }
//     filterConditions.userGroupTrack = new Types.ObjectId(userGroupTrackId);
//   }

//   if (userGroupTrack) {
//     if (!Types.ObjectId.isValid(userGroupTrack)) {
//       throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid userGroupTrack ID');
//     }
//     baseFilter.userGroupTrack = new Types.ObjectId(userGroupTrack);
//   }

//   const queryBuilder = new QueryBuilder(
//     User.find(baseFilter),
//     queryData
//   )
//     .search([
//       'studentId', 'department', 'group', 'track',
//       'location', 'email', 'firstName', 'lastName', 'status'

//     ])
//     .filter()
//     .sort()
//     .paginate();

//   const result = await queryBuilder.queryModel
//     .populate('mentorId', 'firstName lastName email profile contact location')
//     .populate('woop', 'title')
//     .populate('Goals', 'title index description')
//     .populate({
//       path: 'classId',
//       select: 'title description classDate location virtualClass published status',
//       populate: [
//         { path: 'userGroup', select: 'name description', model: 'UserGroup' },
//         { path: 'userGroupTrack', select: 'name description', model: 'UserGroupTrack' },
//       ],
//     })
//     .populate({ path: 'userGroup', select: 'name description', model: 'UserGroup' })
//     .populate({ path: 'userGroupTrack', select: 'name description', model: 'UserGroupTrack' })
//     .exec();

//   const pagination = await queryBuilder.getPaginationInfo();
//   return { data: result, pagination };
// };
const getStudentsForTeacherFromDB = async (
  query: Record<string, any>
) => {
  const { userGroup, userGroupTrack, ...restQuery } = query;

  const baseFilter: Record<string, any> = {
    role: 'STUDENT',
    status: 'ACTIVE'
  };

  // =========================
  // USER GROUP FILTER
  // =========================
  if (userGroup) {
    const userGroupValues = Array.isArray(userGroup)
      ? userGroup
      : String(userGroup)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    const validUserGroupIds = userGroupValues.filter((id) =>
      Types.ObjectId.isValid(id)
    );

    if (!validUserGroupIds.length) {
      return {
        pagination: {
          total: 0,
          totalPage: 1,
          page: 1,
          limit: 10,
        },
        data: [],
      };
    }

    baseFilter.userGroup = {
      $in: validUserGroupIds.map(
        (id) => new Types.ObjectId(id)
      ),
    };
  }

  // =========================
  // USER GROUP TRACK FILTER
  // =========================
  if (userGroupTrack) {
    if (!Types.ObjectId.isValid(userGroupTrack)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Invalid userGroupTrack ID'
      );
    }

    baseFilter.userGroupTrack = new Types.ObjectId(
      userGroupTrack
    );
  }

  // =========================
  // QUERY BUILDER
  // =========================
  const queryBuilder = new QueryBuilder(
    User.find(baseFilter),
    restQuery
  )
    .search([
      'studentId',
      'department',
      'group',
      'track',
      'location',
      'email',
      'firstName',
      'lastName',
      'status',
    ])
    .filter()
    .sort()
    .paginate();

  // =========================
  // RESULT
  // =========================
  const result = await queryBuilder.queryModel
    .populate(
      'mentorId',
      'firstName lastName email profile contact location'
    )
    .populate('woop', 'title')
    .populate('Goals', 'title index description')
    .populate({
      path: 'classId',
      select:
        'title description classDate location virtualClass published status',
      populate: [
        {
          path: 'userGroup',
          select: 'name description',
          model: 'UserGroup',
        },
        {
          path: 'userGroupTrack',
          select: 'name description',
          model: 'UserGroupTrack',
        },
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

  const pagination =
    await queryBuilder.getPaginationInfo();

  return {
    data: result,
    pagination,
  };
};

const getSingleStudentFromDB = async (id: string) => {
  const result = await User.findById(id)
    .populate('mentorId')

    .populate({
      path: 'woop',
      populate: {
        path: 'goal'
      }
    })

    .populate('Goals')

    .populate({
      path: 'classId',
      populate: [
        { path: 'userGroup' },
        { path: 'userGroupTrack' }
      ]
    })

    .populate({
      path: 'review.teacherId',
    })

    .populate({
      path: 'assignedStudents',
      populate: [
        {
          path: 'review.teacherId'
        },
        {
          path: 'classId'
        }
      ]
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

  return result;
};
const updateStudentInDB = async (id: string, payload: Partial<IStudentProfile>) => {
  const result = await StudentProfile.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const addReviewToStudent = async (studentId: string, reviewData: IStudentReview) => {
  const result = await StudentProfile.findByIdAndUpdate(
    studentId,
    {
      $push: { reviews: reviewData },
    },
    { new: true, runValidators: true }
  );
  return result;
};


const deleteStudentFromDB = async (id: string) => {
  const result = await StudentProfile.findByIdAndUpdate(
    id,
    { isDeleted: true, status: 'blocked' },
    { new: true }
  );
  return result;
};

const getmystatsFromDB = async (userId: string) => {
  const result = await User.findOne({ studentId: userId })
    .populate('woop')
    .populate('Goals')
    .populate('mentorId')
    .populate('classId');

  if (!result) {
    // console.log("No StudentProfile found for User ID:", userId);
    throw new Error('Student profile not found for this user');
  }

  const profileId = result._id;
  const submittedAssignmentsCount = await User.countDocuments({
    studentId: profileId, 'assignments.status': 'submitted'
  });


  const countindividual = {
    totalSubmittedAssignments: submittedAssignmentsCount,
    totalClasses: result.classId ? (result.classId as any).totalClasses || 0 : 0,
    mentorName: result.mentorId ? (result.mentorId as any).name || '' : '',
    totalGoals: result.woopGoals?.length || 0,
  }

  return countindividual;
}

// saveOnboardingAnswers
const saveOnboardingAnswersFromDB = async (studentId: string, answers: Record<string, any>) => {
  const result = await StudentProfile.findByIdAndUpdate(
    studentId,
    { onboardingAnswers: answers },
    { new: true, runValidators: true }
  );
  return result;
};

export const StudentService = {
  createStudentIntoDB,
  getAllStudentsFromDB,
  getSingleStudentFromDB,
  updateStudentInDB,
  addReviewToStudent,
  deleteStudentFromDB,
  getmystatsFromDB,
  saveOnboardingAnswersFromDB,
  getStudentsForTeacherFromDB
};