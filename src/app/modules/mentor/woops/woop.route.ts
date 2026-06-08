import express from 'express';
import auth from '../../../middlewares/auth';
import { USER_ROLES } from '../../../../enums/user';
import { mentorWoops } from './woops.controller';
import { WoopValidation } from './woops.validation';
import validateRequest from '../../../middlewares/validateRequest';


const router = express.Router();

router.route("/")
    .post(
        auth(USER_ROLES.MENTOR),
        validateRequest(WoopValidation.createWoopsZodicSchema),
        mentorWoops.createwoop
    )
    .get(
        mentorWoops.getAllWoops
    );

router.route("/:id")
    .get(
        auth(USER_ROLES.MENTOR, USER_ROLES.STUDENT),
        mentorWoops.getUserWoops
    )
    .patch(
        auth(USER_ROLES.MENTOR),
        validateRequest(WoopValidation.updateWoopsZodicSchema),
        mentorWoops.updateWoop
    )
    .delete(
        auth(USER_ROLES.MENTOR),
        mentorWoops.deleteWoop
    );
router.route("/woopId/:id")
    .get(
        auth(USER_ROLES.MENTOR),
        mentorWoops.getWoopById
    );
export const MentorWoopRoutes = router;