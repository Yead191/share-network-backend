import { Document, Types } from 'mongoose';

export type CurrentStatus = 'studying' | 'graduated' | 'other';
export type WorkAuth = 'fully_allowed' | 'limited' | 'not_allowed';
export type PerformanceRating = 1 | 2 | 3 | 4 | 5;

export interface ILanguage {
  language: string;
  level: string;
}

export interface IInternship extends Document {
  // Reference
  studentId: Types.ObjectId;
  studentName: string;
  studentAvatar?: string;

  // 1. Personal Information
  fullName: string;
  dateOfBirth?: string;
  phoneNumber: string;
  email: string;
  currentCity: string;
  cvFileUrl?: string;
  cvFileName?: string;
  linkedIn?: string;
  portfolio?: string;

  // 2. Education
  studyDirection: string;
  institution: string;
  currentStatus: CurrentStatus;
  currentStatusOther?: string;
  expectedGraduation?: string;

  // 3. Skills & Experience
  keySkills: string[];
  languages: ILanguage[];
  workExperience?: string;
  certifications?: string;

  // 4. Evaluation (Admin Only)
  overallScore?: number;
  performanceRating?: PerformanceRating;
  strengths?: string;
  areasForImprovement?: string;

  // 5. Residency Status
  hasDutchResidency: boolean;
  workAuthStatus?: WorkAuth;

  // 6. Asylum Status
  isAsylumSeeker: boolean;
  asylumBackground?: string;

  // 7. Internship Preferences
  interestedInInternship: boolean;
  interestedInFullTime: boolean;
  preferredFields: string[];
  preferredLocation?: string;
  availabilityStartDate?: string;
  availabilityHoursPerWeek?: number;

  // 8. Compliance & Privacy
  consentToShare: boolean;
  doNotShareContact: boolean;
  doNotSharePhoto: boolean;
  anonymousOnly: boolean;

  // 9. Additional Notes
  additionalNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}
