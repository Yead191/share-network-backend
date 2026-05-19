import express from "express";
import { USER_ROLES } from "../../../../../enums/user";
import { StudentController } from "./students.controller";
import auth from "../../../../middlewares/auth";


const router = express.Router();


router.route("/")
    .post(
        auth(
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN
        ),
        StudentController.createStudent
    )
    .get(
        auth(
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.MENTOR,
            USER_ROLES.TEACHER
        ),
        StudentController.getAllStudents
    );
router.route("/for-teacher")
    .get(
        auth(
            USER_ROLES.TEACHER
        ),
        StudentController.getStudentsForTeacher
    );
router.route("/std-stats")
    .get(
        auth(
            USER_ROLES.STUDENT,
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.MENTOR
        ),
        StudentController.getmystats
    );
router.route("/:id")
    .get(
        auth(
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.MENTOR
        ),
        StudentController.getSingleStudent
    )
    .patch(
        auth(
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN
        ),
        StudentController.updateStudent
    )
    .delete(
        auth(
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN
        ),
        StudentController.deleteStudent
    );
router.route("/review/:id")
    .post(
        auth(
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.MENTOR
        ),
        StudentController.addReview
    );
router.route("/onboarding-answers")
    .patch(
        auth(
            USER_ROLES.STUDENT,
            USER_ROLES.ADMIN,
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.MENTOR
        ),
        StudentController.saveOnboardingAnswers
    );
// router.route("/oops-goals")
//     .patch(
//         auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
//         StudentController.oopsGoals
//     );


export const StudentAdminPartRoutes = router;