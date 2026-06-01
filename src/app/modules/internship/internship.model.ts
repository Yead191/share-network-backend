import { model, Schema } from 'mongoose';
import { IInternship } from './internship.interface';

const languageSchema = new Schema(
  {
    language: { type: String, required: true },
    level: { type: String, required: true },
  },
  { _id: false }
);

const internshipSchema = new Schema<IInternship>(
  {
    // Reference
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    studentAvatar: { type: String },

    // 1. Personal Information
    fullName: { type: String, required: true },
    dateOfBirth: { type: String },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    currentCity: { type: String, required: true },
    cvFileUrl: { type: String },
    cvFileName: { type: String },
    linkedIn: { type: String },
    portfolio: { type: String },

    // 2. Education
    studyDirection: { type: String, required: true },
    institution: { type: String, required: true },
    currentStatus: {
      type: String,
      enum: ['studying', 'graduated', 'other'],
      required: true,
    },
    currentStatusOther: { type: String },
    expectedGraduation: { type: String },

    // 3. Skills & Experience
    keySkills: [{ type: String }],
    languages: { type: [languageSchema], default: [] },
    workExperience: { type: String },
    certifications: { type: String },

    // 4. Evaluation (Admin Only)
    overallScore: { type: Number, min: 1, max: 10 },
    performanceRating: { type: Number, enum: [1, 2, 3, 4, 5] },
    strengths: { type: String },
    areasForImprovement: { type: String },

    // 5. Residency Status
    hasDutchResidency: { type: Boolean, required: true, default: false },
    workAuthStatus: {
      type: String,
      enum: ['fully_allowed', 'limited', 'not_allowed'],
    },

    // 6. Asylum Status
    isAsylumSeeker: { type: Boolean, required: true, default: false },
    asylumBackground: { type: String },

    // 7. Internship Preferences
    interestedInInternship: { type: Boolean, required: true, default: false },
    interestedInFullTime: { type: Boolean, required: true, default: false },
    preferredFields: [{ type: String }],
    preferredLocation: { type: String },
    availabilityStartDate: { type: String },
    availabilityHoursPerWeek: { type: Number, min: 1, max: 40 },

    // 8. Compliance & Privacy
    consentToShare: { type: Boolean, required: true, default: false },
    doNotShareContact: { type: Boolean, required: true, default: false },
    doNotSharePhoto: { type: Boolean, required: true, default: false },
    anonymousOnly: { type: Boolean, required: true, default: false },

    // 9. Additional Notes
    additionalNotes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Internship = model<IInternship>('Internship', internshipSchema);
