import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { MessageController } from './message.controller';
import fileUploadHandler from '../../middlewares/fileUploaderHandler';
import { getMultipleFilesPath } from '../../../shared/getFilePath';
const router = express.Router();

router.post('/',
    auth(USER_ROLES.MENTOR, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.COORDINATOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    fileUploadHandler(),
    async (req: Request, res: Response, next: NextFunction) => {
        try {

            const images = getMultipleFilesPath(req.files, "image");

            req.body = {
                images, 
                ...req.body, 
                sender: req.user.id
            };
            next();

        } catch (error) {
            return res.status(500).json({ message: "Invalid Image Format" });
        }
    },
    MessageController.sendMessage
);
router.get('/:id',
    auth(USER_ROLES.MENTOR, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.COORDINATOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    MessageController.getMessage
);

router.patch('/:id',
    auth(USER_ROLES.MENTOR, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.COORDINATOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    MessageController.updateMessage
);
router.delete('/:id',
    auth(USER_ROLES.MENTOR, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.COORDINATOR, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    MessageController.deleteMessage
);


export const MessageRoutes = router;
