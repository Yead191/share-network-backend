import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { ReportController } from './report.controller';
const router = express.Router();


router.post('/', 
    auth(USER_ROLES.MENTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TEACHER),
    ReportController.createReport
);

export const ReportRoutes = router;