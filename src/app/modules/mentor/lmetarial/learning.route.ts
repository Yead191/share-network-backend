import express from "express";
import { mentorLearningMaterial } from "./learning.controller";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";
import fileUploadHandler from "../../../middlewares/fileUploaderHandler";



const router = express.Router();

router.route("/")
    .post(
        auth(USER_ROLES.MENTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TEACHER , USER_ROLES.COORDINATOR),
       fileUploadHandler(),
        mentorLearningMaterial.createResource
    )
    .get(
        auth(USER_ROLES.MENTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT , USER_ROLES.COORDINATOR),
        mentorLearningMaterial.getAllResources
    );

router.route("/all")
    .get(
        auth(USER_ROLES.MENTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT , USER_ROLES.COORDINATOR),
        mentorLearningMaterial.getAllMentorResources
    );

router.route("/:id")
    .get(
        auth(USER_ROLES.MENTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TEACHER, USER_ROLES.COORDINATOR),
        mentorLearningMaterial.getCreatedByResources
    )
    .patch(
        auth(USER_ROLES.MENTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TEACHER, USER_ROLES.COORDINATOR),
        fileUploadHandler(),
        mentorLearningMaterial.updateResource
    )
    .delete(
        auth(USER_ROLES.MENTOR, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TEACHER, USER_ROLES.COORDINATOR),
        mentorLearningMaterial.deleteResource
    );
    
router.route("/resource/:id")
    .get(
        mentorLearningMaterial.getResourceById
    );
router.route("/filtered")
    .get(
        mentorLearningMaterial.getFilteredResources
    );
export const LearningMaterialRoutes = router;