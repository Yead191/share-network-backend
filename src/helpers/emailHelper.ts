// import nodemailer from 'nodemailer';
// import config from '../config';
// import { errorLogger, logger } from '../shared/logger';
// import { ISendEmail } from '../types/email';

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: parseInt(process.env.EMAIL_PORT || '587'),
//   secure: process.env.EMAIL_PORT === '465',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   },
//   tls: {
//     rejectUnauthorized: false
//   },
//   connectionTimeout: 20000,
//   greetingTimeout: 20000,
//   socketTimeout: 20000,
// });

// export const sendEmail = async (mailOptions: any) => {
//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log('✅ Email sent successfully:', info.messageId);
//     return info;
//   } catch (error) {
//     console.error('❌ Email sending failed:', error);
//     throw error;
//   }
// };

// export const emailHelper = {
//     sendEmail
// };

// // EMAIL_FROM=abdullaalnuman129@gmail.com
// // EMAIL_USER=abdullaalnuman129@gmail.com
// // EMAIL_PASS=nbezwqzcdjvfndyo
// // EMAIL_PORT=587
// // EMAIL_HOST=smtp.gmail.com

import nodemailer from "nodemailer";
import config from "../config";
import { errorLogger, logger } from "../shared/logger";
import { ISendEmail } from "../types/email";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port),
  secure: true,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendEmail = async (values: ISendEmail) => {
  try {
    const result = await transporter.sendMail({
      from: `"Share Network App" <${config.email.from}>`,
      to: values.to,
      subject: values.subject,
      html: values.html,
    });
    console.log("Email sent successfully", result);
  } catch (error) {
    console.log("Email->sendEmail", error);
  }
};

export const emailHelper = {
  sendEmail,
};
