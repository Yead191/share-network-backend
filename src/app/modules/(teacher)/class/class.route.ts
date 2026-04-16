import express from "express";
import { USER_ROLES } from "../../../../enums/user";
import auth from "../../../middlewares/auth";
import { ClassController } from "./class.controller";
import fileUploadHandler from "../../../middlewares/fileUploaderHandler";

const router = express.Router();

router
  .route("/")
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TEACHER),
    fileUploadHandler(),
    ClassController.createClass,
  )
  .get(ClassController.getAllClasses);

router
  .route("/:id")
  .get(
    auth(
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.TEACHER,
      USER_ROLES.STUDENT,
    ),
    fileUploadHandler(),
    ClassController.getClassById,
  )
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TEACHER),
    fileUploadHandler(),
    ClassController.updateClass,
  )
  .delete(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.TEACHER),
    ClassController.deleteClass,
  );

export const ClassRoutes = router;
