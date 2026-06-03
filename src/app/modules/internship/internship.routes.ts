import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { internshipController } from './internship.controller';
import fileUploadHandler from '../../middlewares/fileUploaderHandler';

const router = express.Router();

// ─── Create — Admin only ──────────────────────────────────────────────────────
// POST /api/v1/internship
router.post(
  '/',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  fileUploadHandler(),
  internshipController.createInternship
);

// ─── Get All — Admin + Coordinator ───────────────────────────────────────────
// GET /api/v1/internship?page=1&limit=10&searchTerm=sara
router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.COORDINATOR),
  internshipController.getAllInternships
);

// --- get all internship statistics ---
// GET /api/v1/internship/stats
router.get(
  '/stats',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.COORDINATOR),
  internshipController.getInternshipStats
);

// ─── Get Single — Admin + Coordinator ────────────────────────────────────────
// GET /api/v1/internship/:id
router.get(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.COORDINATOR),
  internshipController.getInternshipById
);

// ─── Update — Admin only ──────────────────────────────────────────────────────
// PATCH /api/v1/internship/:id
router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  fileUploadHandler(),
  internshipController.updateInternship
);

// ─── Delete — Admin only ──────────────────────────────────────────────────────
// DELETE /api/v1/internship/:id
router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  internshipController.deleteInternship
);

export const InternshipRoutes = router;
