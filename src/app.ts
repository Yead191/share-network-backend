import express, { Request, Response } from "express";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import { Morgan } from "./shared/morgan";
import router from '../src/app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import handleStripeWebhook from "./webhook/handleStripeWebhook";
import { requestLogger } from "./shared/response.time.logger";
import path from "path";
import { logger } from "./shared/logger";
const app = express();
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://72.61.74.10:4173",
        "https://web.share-network.org",
        "https://app.share-network.org",
        "http://localhost:4173",
        "http://10.10.7.6:4173",
        "http://10.10.7.13:4173",
        "http://localhost:4173",
        "http://10.10.7.72:4173",
        "http://10.10.7.9:4173",
        "http://10.10.7.50:4173",
      ];
      
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked by CORS: ${origin}`);
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
//debug
app.use(requestLogger());
// morgan
// app.use(Morgan.successHandler);
// app.use(Morgan.errorHandler);


// stripe webhook 
app.use(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
);


//body parser
// app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    etag: false, 
    lastModified: false,
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

//router
app.use('/api/v1', router);

app.get("/", (req: Request, res: Response) => {
    res.send("Hey Welcome to the server World. How can I assist you");
})

//global error handle
app.use(globalErrorHandler);

// handle not found route
app.use((req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Not Found",
        errorMessages: [
            {
                path: req.originalUrl,
                message: "API DOESN'T EXIST"
            }
        ]
    })
});

export default app;