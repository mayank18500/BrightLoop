import { Router } from "express";
import { Role } from "@prisma/client";
import { usersController } from "./users.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";
import { createStaffSchema, updateStaffStatusSchema } from "./users.validation";

const router = Router();

// All staff management routes require ADMIN role
router.use(authenticateUser, authorizeRoles(Role.ADMIN));

router.post("/staff", validateRequest(createStaffSchema), (req, res, next) =>
  usersController.createStaff(req, res, next)
);

router.get("/staff", (req, res, next) =>
  usersController.listStaff(req, res, next)
);

router.patch("/:id/status", validateRequest(updateStaffStatusSchema), (req, res, next) =>
  usersController.updateStatus(req, res, next)
);

export default router;
