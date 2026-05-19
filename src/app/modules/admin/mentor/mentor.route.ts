import express from 'express';
import { USER_ROLES } from '../../../../enums/user';
import auth from '../../../middlewares/auth';
import { adminMentorController } from './mentor.controller';
import excelUploadHandler from '../../../middlewares/excelUploadHandler';

const router = express.Router();
router.route("/")
    .post(
        excelUploadHandler(),
        auth(
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN
        ),
        adminMentorController.bulkUploadMentors
    )
    .get(
        auth(
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN
        ),
        adminMentorController.getAllMentors
    );

router.route("/:id")
    .get(
        // auth(
        //     USER_ROLES.ADMIN, 
        //     USER_ROLES.SUPER_ADMIN, 
        //     USER_ROLES.MENTOR, 
        //     USER_ROLES.STUDENT, 
        //     USER_ROLES.TEACHER
        // ),
        adminMentorController.getMentorById
    )
    .patch(
        auth(
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.COORDINATOR
        ),
        adminMentorController.updateMentor
    )
    .delete(
        auth(
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.MENTOR
        ),
        adminMentorController.deleteMentor
    );

export const adminMentorRoutes = router;