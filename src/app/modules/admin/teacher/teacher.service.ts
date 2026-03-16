import xlsx from 'xlsx';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { User } from '../../user/user.model';
import { USER_ROLES } from '../../../../enums/user';
import { UserGroup } from '../../user-group/user-group.model';
import { IStudentReview } from '../students/management/students.interface';
import { StudentProfile } from '../students/management/students.model';
import { query } from 'winston';
import QueryBuilder from '../../../../shared/apiFeature';
import { Types } from 'mongoose';

const bulkImportTeachers = async (fileBuffer: Buffer) => {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const teachersData = xlsx.utils.sheet_to_json(sheet);
    if (!teachersData.length) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Excel file is empty');
    }

    const createdUsers = [];
    const errors = [];

    for (const data of teachersData as any[]) {
        try {
            const { 
                FirstName, LastName, Email, Phone, 
                Company, JobTitle, userGroup, Bio, 
                Password 
            } = data;

            if (!Email) continue;

            const existingUser = await User.findOne({ email: Email });
            if (existingUser) {
                errors.push(`Email ${Email} already exists.`);
                continue;
            }

            let userGroupIds: any[] = [];

            if (userGroup) {
                const groupNames = userGroup.toString().split(',').map((g: string) => g.trim());
                
                const foundGroups = await UserGroup.find({
                    name: { $in: groupNames }
                }).select('_id'); 

                if (foundGroups.length > 0) {
                    userGroupIds = foundGroups.map((group: { _id: any; }) => group._id);
                } else {
                    errors.push(`User group(s) not found: ${userGroup}`);
                }
            }

            const userData = {
                name: `${FirstName} ${LastName}`,
                email: Email,
                mobileNumber: Phone?.toString(),
                role: USER_ROLES.TEACHER,
                password: Password ? String(Password) : '11111111',
                professionalTitle: JobTitle,
                company: Company,
                
                userGroup: userGroupIds,
                
                about: Bio || "",
                accountInformation: { status: false },
                isSubscribed: false,
                isUpdate: false,
                verified: true,
                discount: 0
            };

            const newUser = await User.create(userData);
            createdUsers.push(newUser);

        } catch (err: any) {
            errors.push(`Error for ${data?.Email}: ${err.message}`);
        }
    }

    return {
        importedCount: createdUsers.length,
        errorCount: errors.length,
        errors: errors,
        message: 'Teacher Bulk import process completed'
    };
};

// const getAllTeachersFromDB = async (query: Record<string, any>) => {
//     const teachers = await new QueryBuilder(User.find({ role: USER_ROLES.TEACHER }), query).search(['name', 'email']).filter().sort().paginate().queryModel
//     .populate('userGroup')
//     .populate('assignedStudents')
//     .lean();
//     return teachers;
// };

const getAllTeachersFromDB = async (query: Record<string, any>) => {
  const { userGroup, ...restQuery } = query;

  let filter: any = {
    role: USER_ROLES.TEACHER,
  };

  if (userGroup) {
    if (Types.ObjectId.isValid(userGroup)) {
      filter.userGroup = new Types.ObjectId(userGroup);
    } else {
      return [];
    }
  }

  const teachers = await new QueryBuilder(
    User.find(filter),
    restQuery
  )
    .search(["firstName", "email"])
    .filter()
    .sort()
    .paginate()
    .queryModel
    .populate("userGroup")
    .populate("assignedStudents")
    .lean();

  return teachers;
};

const getTeacherById = async (id: string) => {
    const teacher = await User.findById(id)
    .populate('userGroup');
    if (!teacher || teacher.role !== USER_ROLES.TEACHER) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }
    return teacher;
};

const updateTeacher = async (id: string, updateData: Partial<any>) => {
    const teacher = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!teacher || teacher.role !== USER_ROLES.TEACHER) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }
    return teacher;
};



const deleteTeacher = async (id: string) => {
    const teacher = await User.findByIdAndDelete(id);
    if (!teacher || teacher.role !== USER_ROLES.TEACHER) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }
    return teacher;
}

export const UserService = {
    bulkImportTeachers,
    getAllTeachersFromDB,
    getTeacherById,
    updateTeacher,
    deleteTeacher
};