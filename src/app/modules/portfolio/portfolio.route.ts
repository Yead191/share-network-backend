import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { PortfolioController } from './portfolio.controller';
import fileUploadHandler from '../../middlewares/fileUploaderHandler';
import { getMultipleFilesPath } from '../../../shared/getFilePath';
const router = express.Router();

router
    .route('/')
    .post(
        auth(USER_ROLES.PROVIDER),
        fileUploadHandler(),
        async (req: Request, res: Response, next: NextFunction) => {
            try {

                const images = getMultipleFilesPath(req.files, "image");
                const result = images?.map((image: string) => {
                    return {
                        image: image,
                        PROVIDER: req.user.id
                    }
                });

                req.body = result;
                next();

            } catch (error) {
                return res.status(500).json({ message: "Invalid Image Format" });
            }
        },
        PortfolioController.createPortfolio
    )
    .get(
        auth(USER_ROLES.PROVIDER),
        PortfolioController.getPortfolio
    );

router

    .route('/:id')
    .delete(
        auth(USER_ROLES.PROVIDER),
        PortfolioController.deletePortfolio
    )

export const PortfolioRoutes = router; 