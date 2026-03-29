import express from 'express';
import auth from '../../../middlewares/auth';
import { USER_ROLES } from '../../../../enums/user';
import validateRequest from '../../../middlewares/validateRequest';
import { mentorWeeklyReport } from '../report/report.controller';
import { ReportValidation } from '../report/report.validation';



const router = express.Router();

router.route("/")
    .post(
        auth(USER_ROLES.MENTOR),
        validateRequest(ReportValidation.createWeeklyReportZodSchema),
        mentorWeeklyReport.createWeeklyReport
    )
    .get(
        mentorWeeklyReport.getAllReports
    );

router.route("/student/:studentId")
    .get(
        mentorWeeklyReport.getReportByStudentIdAndWeekRange
    );

router.route("/:id")
    .get(
        mentorWeeklyReport.getStudentReports
    )
    .patch(
        auth(USER_ROLES.MENTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        validateRequest(ReportValidation.updateWeeklyReportZodSchema),
        mentorWeeklyReport.updateWeeklyReport
    )
    .delete(
        auth(USER_ROLES.MENTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        mentorWeeklyReport.deleteWeeklyReport
    );



export const MentorReportRoutes = router;