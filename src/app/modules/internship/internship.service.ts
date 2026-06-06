import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { Internship } from './internship.model';
import { IInternship } from './internship.interface';
import fs from 'fs';
import path from 'path';
import { User } from '../user/user.model';
import { validateInternshipPayload } from '../../../helpers/validateInternshipPayload';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Parse JSON strings that come in through FormData (arrays sent as JSON strings) */
const parseArrayField = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // comma-separated fallback
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const parseJsonField = <T>(value: unknown): T | undefined => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }
  return value as T | undefined;
};

const parseBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  return false;
};

/** Delete old CV file from disk if it exists */
const deleteOldCv = (cvFileUrl?: string) => {
  if (!cvFileUrl) return;
  // cvFileUrl stored as relative path like "uploads/cv/filename.pdf"
  const fullPath = path.join(process.cwd(), cvFileUrl);
  if (fs.existsSync(fullPath)) {
    fs.unlink(fullPath, (err) => {
      if (err) console.error('Failed to delete old CV file:', err);
    });
  }
};

// ─── Create ──────────────────────────────────────────────────────────────────

const createInternship = async (
  payload: Partial<IInternship>
) => {

  const isUserExist = await User.findById(payload.studentId)

  if (!isUserExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User not found');
  }

  const isInternshipExist = await Internship.findOne({ studentId: payload.studentId })

  if (isInternshipExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This Profile has already created an Internship profile');
  }
  validateInternshipPayload(payload);

  // Parse FormData fields that were JSON-stringified on the frontend
  let data: Partial<IInternship> = {
    ...payload,
    // cvFileUrl: cvPath,
    keySkills: parseArrayField(payload.keySkills),
    preferredFields: parseArrayField(payload.preferredFields),
    // languages: parseJsonField<IInternship['languages']>(payload.languages as unknown) ?? [],
    hasDutchResidency: parseBool(payload.hasDutchResidency),
    isAsylumSeeker: parseBool(payload.isAsylumSeeker),
    interestedInInternship: parseBool(payload.interestedInInternship),
    interestedInFullTime: parseBool(payload.interestedInFullTime),
    consentToShare: parseBool(payload.consentToShare),
    doNotShareContact: parseBool(payload.doNotShareContact),
    doNotSharePhoto: parseBool(payload.doNotSharePhoto),
    anonymousOnly: parseBool(payload.anonymousOnly),
  };

  // I will convert string object to json
  if (payload.languages) {
    data.languages = data.languages?.map((language: any) => {
      return JSON.parse(language)
    });
  }
  // console.log(data)
  const internship = await Internship.create(data);
  await User.findOneAndUpdate({ _id: payload.studentId }, {
    $set: {
      internship: internship._id
    }
  })
  return internship;
};

// ─── Get All (with pagination + search) ──────────────────────────────────────

const getAllInternships = async (query: {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const { page = 1, limit = 10, searchTerm, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (searchTerm) {
    filter.$or = [
      { studentName: { $regex: searchTerm, $options: 'i' } },
      { fullName: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { currentCity: { $regex: searchTerm, $options: 'i' } },
      { studyDirection: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  const sortOptions: Record<string, 1 | -1> = {};
  if (sortBy) {
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sortOptions['createdAt'] = -1;
  }

  const [data, total] = await Promise.all([
    Internship.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    Internship.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      totalPage: Math.ceil(total / limit),
      page,
      limit,
    },
  };
};

// ─── Get Single ───────────────────────────────────────────────────────────────

const getInternshipById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid internship id');
  }

  const internship = await Internship.findById(id).lean();

  if (!internship) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Internship profile not found');
  }

  return internship;
};

// ─── Update ───────────────────────────────────────────────────────────────────

const updateInternship = async (
  id: string,
  payload: Partial<IInternship>,
) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid internship id');
  }

  const existing = await Internship.findById(id);
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Internship profile not found');
  }

  validateInternshipPayload(payload);

  const data: Partial<IInternship> = { ...payload };

  // Only re-parse if the fields were actually sent in this request
  if (payload.keySkills !== undefined)
    data.keySkills = parseArrayField(payload.keySkills);
  if (payload.preferredFields !== undefined)
    data.preferredFields = parseArrayField(payload.preferredFields);
  // I will convert string object to json
  if (payload.languages !== undefined) {
    data.languages = (data.languages as any[])?.map((language: any) => {
      return JSON.parse(language);
    }) ?? existing.languages;
  }

  if (payload.studentId !== undefined && existing.studentId.toString() !== payload.studentId as any) {
    data.studentId = payload.studentId;
    await User.findOneAndUpdate({ _id: existing.studentId }, {
      $set: {
        internship: null
      }
    })
    await User.findOneAndUpdate({ _id: payload.studentId }, {
      $set: {
        internship: id
      }
    })
  }

  // Boolean coercion (FormData sends strings)
  if (payload.hasDutchResidency !== undefined) data.hasDutchResidency = parseBool(payload.hasDutchResidency);
  if (payload.isAsylumSeeker !== undefined) data.isAsylumSeeker = parseBool(payload.isAsylumSeeker);
  if (payload.interestedInInternship !== undefined) data.interestedInInternship = parseBool(payload.interestedInInternship);
  if (payload.interestedInFullTime !== undefined) data.interestedInFullTime = parseBool(payload.interestedInFullTime);
  if (payload.consentToShare !== undefined) data.consentToShare = parseBool(payload.consentToShare);
  if (payload.doNotShareContact !== undefined) data.doNotShareContact = parseBool(payload.doNotShareContact);
  if (payload.doNotSharePhoto !== undefined) data.doNotSharePhoto = parseBool(payload.doNotSharePhoto);
  if (payload.anonymousOnly !== undefined) data.anonymousOnly = parseBool(payload.anonymousOnly);

  const updated = await Internship.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  return updated;
};

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteInternship = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid internship id');
  }

  const internship = await Internship.findById(id);
  if (!internship) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Internship profile not found');
  }

  // Clean up CV file from disk
  deleteOldCv(internship.cv);

  await User.findOneAndUpdate({ _id: internship.studentId }, {
    $set: {
      internship: null
    }
  })

  await Internship.findByIdAndDelete(id);
  return { message: 'Internship profile deleted successfully' };
};
const getInternshipStats = async () => {
  const totalProfiles = await Internship.countDocuments();
  const interestedInInternship = await Internship.countDocuments({ interestedInInternship: true });
  const dutchResidency = await Internship.countDocuments({ hasDutchResidency: true });
  const graduatedStudents = await Internship.countDocuments({
    currentStatus: 'graduated'
  })
  const averageScore = await Internship.aggregate([
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$overallScore' },
      },
    },
    {
      $project: {
        _id: 0,
        averageScore: { $round: ['$averageScore', 2] },
      },
    },
  ]);
  const distribution = await Internship.aggregate([
    {
      $group: {
        _id: null,
        low: {
          $sum: {
            $cond: [{ $lte: ['$overallScore', 5] }, 1, 0],
          },
        },
        medium: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ['$overallScore', 5] },
                  { $lte: ['$overallScore', 7] },
                ],
              },
              1,
              0,
            ],
          },
        },
        good: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ['$overallScore', 7] },
                  { $lte: ['$overallScore', 8.5] },
                ],
              },
              1,
              0,
            ],
          },
        },
        excellent: {
          $sum: {
            $cond: [{ $gt: ['$overallScore', 8.5] }, 1, 0],
          },
        },
      },
    },
  ]);
  return {
    totalProfiles,
    interestedInInternship,
    dutchResidency,
    graduatedStudents,
    averageScore: averageScore[0]?.averageScore || 0,
    distribution: {
      low: distribution[0]?.low || 0,
      medium: distribution[0]?.medium || 0,
      good: distribution[0]?.good || 0,
      excellent: distribution[0]?.excellent || 0,
    }
  };
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const internshipService = {
  createInternship,
  getAllInternships,
  getInternshipById,
  updateInternship,
  deleteInternship,
  getInternshipStats
};
