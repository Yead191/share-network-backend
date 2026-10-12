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

    // allowed MIME types
    const allowedMimeTypes = [
        // Images
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        // Documents & PDFs
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/rtf',
        'text/rtf',
        // Spreadsheets
        'application/vnd.ms-excel', // .xls
        'application/msexcel',
        'application/x-msexcel',
        'application/x-ms-excel',
        'application/x-excel',
        'application/x-dos_ms_excel',
        'application/xls',
        'application/x-xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/csv',
        'application/csv',
        'text/x-csv',
        'application/x-csv',
        // Presentations
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        // OpenDocument formats
        'application/vnd.oasis.opendocument.presentation',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.text',
        // Web & Code
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/x-javascript',
        'text/plain',
        'application/typescript',
        'text/typescript',
        'application/json',
        'application/xml',
        'text/xml',
        // Archives
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/vnd.rar',
        'application/x-7z-compressed',
    ];

    // allowed extensions as a fallback for various client environments
    const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
        '.pdf',
        '.doc', '.docx',
        '.xls', '.xlsx', '.csv',
        '.ppt', '.pptx',
        '.odt', '.ods', '.odp',
        '.txt', '.rtf', '.html', '.htm', '.css', '.js', '.ts', '.json', '.xml',
        '.zip', '.rar', '.7z'
    ];

    //file filter
    const filterFilter = (req: Request, file: any, cb: FileFilterCallback) => {
        if (file.fieldname === 'image' || file.fieldname === 'submittedfile' || file.fieldname === 'attachment' || file.fieldname === 'file' || file.fieldname === 'cv') {
            const ext = path.extname(file.originalname).toLowerCase();
            if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
                cb(null, true);
            } else {
                cb(new ApiError(StatusCodes.BAD_REQUEST, `Only supported file formats (.jpeg, .png, .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .csv, .txt, etc.) are allowed`));
            }
        } else {
            cb(new ApiError(StatusCodes.BAD_REQUEST, 'This file is not supported'));
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
