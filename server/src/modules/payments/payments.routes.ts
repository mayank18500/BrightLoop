import { Router } from "express";
import { Role } from "@prisma/client";
import { PaymentsController } from "./payments.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";
import {
  allocatePaymentSchema,
  getPaymentsQuerySchema,
  recordPaymentSchema,
} from "./payments.validation";

const router = Router();
const controller = new PaymentsController();

router.use(authenticateUser);

// Metrics endpoint (must be before /:id)
router.get("/metrics", (req, res, next) =>
  controller.getPaymentMetrics(req, res).catch(next)
);

// List payments (Customer isolated to own; Staff/Admin access all)
router.get("/", validateRequest(getPaymentsQuerySchema), (req, res, next) =>
  controller.getPayments(req, res).catch(next)
);

// Record incoming payment (Admin/Staff only)
router.post(
  "/",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  validateRequest(recordPaymentSchema),
  (req, res, next) => controller.recordPayment(req, res).catch(next)
);

// Allocate existing payment unallocated balance to invoices (Admin/Staff only)
router.post(
  "/:id/allocate",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  validateRequest(allocatePaymentSchema),
  (req, res, next) => controller.allocatePayment(req, res).catch(next)
);

// Single payment detail
router.get("/:id", (req, res, next) =>
  controller.getPaymentById(req, res).catch(next)
);

export default router;
