
import express from "express";
import { AttendanceController } from "./attendance.controller";
import { USER_ROLES } from "../../../../../enums/user";
import auth from "../../../../middlewares/auth";

const router = express.Router();

// 1. Specific Routes FIRST
router.patch(
    "/update-student-status",
    auth(
        USER_ROLES.ADMIN, 
        USER_ROLES.SUPER_ADMIN, 
        USER_ROLES.MENTOR,
        USER_ROLES.TEACHER
    ),
    AttendanceController.updateStudentStatus
);

router.route("/")
    .post(
        auth(
            USER_ROLES.ADMIN, 
            USER_ROLES.SUPER_ADMIN, 
            USER_ROLES.MENTOR,
            USER_ROLES.TEACHER
        ),
        AttendanceController.saveBatchAttendance
    )
    .get(
        // auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.MENTOR),
        AttendanceController.getAttendance
    );
router.get(
    "/stats/:groupId",
    // auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.MENTOR),
    AttendanceController.getAttendanceStats
);


router.patch(
    "/record/:id",
    auth(
        USER_ROLES.ADMIN, 
        USER_ROLES.SUPER_ADMIN,
         USER_ROLES.MENTOR,
         USER_ROLES.TEACHER
        ),
    AttendanceController.updateSpecificRecord
);

router.get(
    "/student/:studentId",
    auth(
        USER_ROLES.ADMIN, 
        USER_ROLES.SUPER_ADMIN,
         USER_ROLES.MENTOR,
         USER_ROLES.TEACHER
        ),
    AttendanceController.getStudentIdFromAttendance
);

router.get(
    "/recent",
    auth(
        USER_ROLES.ADMIN, 
        USER_ROLES.SUPER_ADMIN,
         USER_ROLES.MENTOR,
         USER_ROLES.TEACHER
        ),
    AttendanceController.getRecentAttendance
);



export const AttendenceRoutes = router;
