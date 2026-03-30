import { z } from 'zod'

const createWeeklyReportZodSchema = z.object({
    body: z.object({
        studentId: z.string({ required_error: 'Student ID is required' }),
        weekStartDate: z.string({ required_error: 'Week start date is required' }),
        weekEndDate: z.string({ required_error: 'Week end date is required' }),
        // isPresent: z.boolean({ required_error: 'Presence status is required' }),
        // achievedHardOutcomes: z.array(z.string(), { required_error: 'Achieved hard outcomes are required' }),
        // softSkillImprovements: z.array(z.string(), { required_error: 'Soft skill improvements are required' }),
        // comments: z.string().optional(),
        // goalSheet: z.object({
        //     skillName: z.string({ required_error: 'Skill name is required' }),
        //     plannedProgress: z.number({ required_error: 'Planned progress is required' }),
        //     actualProgress: z.number({ required_error: 'Actual progress is required' }),
        // }),
        objectives: z.string().optional(),
    }),
})

const updateWeeklyReportZodSchema = z.object({
    body: z.object({
        objectives: z.string().optional(),
    }),
})

export const ReportValidation = {
    createWeeklyReportZodSchema,
    updateWeeklyReportZodSchema,
}