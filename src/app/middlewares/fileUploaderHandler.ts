import { Request } from 'express';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import ApiError from '../../errors/ApiError';

const fileUploadHandler = () => {

    //create upload folder
    const baseUploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(baseUploadDir)) {
        fs.mkdirSync(baseUploadDir);
    }

    //folder create for different file
    const createDir = (dirPath: string) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
    };

    //create filename
    const storage = multer.diskStorage({

        destination: (req, file, cb) => {
            let uploadDir;
            switch (file.fieldname) {
                case 'image':
                    uploadDir = path.join(baseUploadDir, 'images');
                    break;
                case 'submittedfile':
                    uploadDir = path.join(baseUploadDir, 'student-assignments');
                    break;
                case 'attachment':
                    uploadDir = path.join(baseUploadDir, 'attachments');
                    break;
                case 'file':
                    uploadDir = path.join(baseUploadDir, 'files');
                    break;
                case 'cv':
                    uploadDir = path.join(baseUploadDir, 'cvs');
                    break;
                default:
                    throw new ApiError(StatusCodes.BAD_REQUEST, 'File is not supported');
            }
            createDir(uploadDir);
            cb(null, uploadDir);
        },

        filename: (req, file, cb) => {
            const fileExt = path.extname(file.originalname);
            const fileName =
                file.originalname
                    .replace(fileExt, '')
                    .toLowerCase()
                    .split(' ')
                    .join('-') +
                '-' +
                Date.now();
            cb(null, fileName + fileExt);
        },
    });

    //file filter
    const filterFilter = (req: Request, file: any, cb: FileFilterCallback) => {

        // console.log("file handler",file)
        if (file.fieldname === 'image' || file.fieldname === 'submittedfile' || file.fieldname === 'attachment' || file.fieldname === 'file' || file.fieldname === 'cv') {
            if (
                file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpg' ||
                file.mimetype === 'image/webp' ||
                file.mimetype === 'application/pdf' ||
                file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.mimetype === 'application/vnd.oasis.opendocument.presentation' || file.mimetype === 'application/vnd.oasis.opendocument.spreadsheet' || file.mimetype === 'application/vnd.oasis.opendocument.text' ||
                file.mimetype === 'text/html' ||
                file.mimetype === 'text/css' ||
                file.mimetype === 'text/javascript' ||
                file.mimetype === 'text/plain' ||
                file.mimetype === 'application/typescript' ||
                file.mimetype === 'text/typescript'

            ) {
                cb(null, true);
            } else {
                cb(new ApiError(StatusCodes.BAD_REQUEST, 'Only .jpeg, .png, .jpg file supported'))
            }
        }
        // else if (file.fieldname === 'attachment') {
        //     if (
        //         file.mimetype === 'application/pdf' ||
        //         file.mimetype === 'text/html' ||
        //         file.mimetype === 'text/css' ||
        //         file.mimetype === 'application/javascript' ||
        //         file.mimetype === 'text/javascript' ||
        //         file.mimetype === 'text/plain' ||
        //         file.mimetype === 'application/typescript' ||
        //         file.mimetype === 'text/typescript'

        //     ) {
        //         cb(null, true);
        //     } else {
        //         cb(new ApiError(StatusCodes.BAD_REQUEST, 'Only .pdf, .html, .css, .js, .ts, .txt file supported'))
        //     }
        // }
        else {
            cb(new ApiError(StatusCodes.BAD_REQUEST, 'This file is not supported'))
        }
    };

    const upload = multer({ storage: storage, fileFilter: filterFilter })
        .fields([
            { name: 'image', maxCount: 30 },
            { name: 'submittedfile', maxCount: 15 },
            { name: 'attachment', maxCount: 15 },
            { name: 'file', maxCount: 15 },
            { name: 'cv', maxCount: 15 },
        ]);
    return upload;

};

export default fileUploadHandler;
