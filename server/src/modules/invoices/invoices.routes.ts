import { Router } from "express";
import { Role } from "@prisma/client";
import { InvoicesController } from "./invoices.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";
import {
  createInvoiceSchema,
  getInvoicesQuerySchema,
  runRecurringBillingSchema,
} from "./invoices.validation";

const router = Router();
const controller = new InvoicesController();

router.use(authenticateUser);

// Metrics endpoint (must be before /:id)
router.get("/metrics", (req, res, next) =>
  controller.getInvoiceMetrics(req, res).catch(next)
);

// List invoices (Customer isolated to own; Staff/Admin access all)
router.get("/", validateRequest(getInvoicesQuerySchema), (req, res, next) =>
  controller.getInvoices(req, res).catch(next)
);

// Trigger recurring billing runner (Admin/Staff only)
router.post(
  "/generate-recurring",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  validateRequest(runRecurringBillingSchema),
  (req, res, next) => controller.runRecurringBilling(req, res).catch(next)
);

// Manual invoice creation (Admin/Staff only)
router.post(
  "/",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  validateRequest(createInvoiceSchema),
  (req, res, next) => controller.createInvoice(req, res).catch(next)
);

// Single invoice detail
router.get("/:id", (req, res, next) =>
  controller.getInvoiceById(req, res).catch(next)
);

// Lifecycle actions (Admin/Staff only)
router.post(
  "/:id/confirm",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  (req, res, next) => controller.confirmInvoice(req, res).catch(next)
);

router.post(
  "/:id/cancel",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  (req, res, next) => controller.cancelInvoice(req, res).catch(next)
);

export default router;
