import { Router } from "express";
import { Role } from "@prisma/client";
import { ReportsController } from "./reports.controller";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";

const router = Router();
const controller = new ReportsController();

router.use(authenticateUser);

router.get(
  "/analytics",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  (req, res, next) => controller.getFinancialAnalytics(req, res).catch(next)
);

export default router;
