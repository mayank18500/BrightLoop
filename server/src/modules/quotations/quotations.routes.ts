import { Router } from "express";
import { Role } from "@prisma/client";
import { quotationsController } from "./quotations.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";
import {
  createQuotationSchema,
  updateQuotationSchema,
  createTemplateSchema,
  convertQuotationSchema,
} from "./quotations.validation";

const router = Router();

router.use(authenticateUser);

// Reusable Templates (Admin and Staff)
router.get("/templates", authorizeRoles(Role.ADMIN, Role.STAFF), (req, res, next) =>
  quotationsController.listTemplates(req, res, next)
);

router.post(
  "/templates",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  validateRequest(createTemplateSchema),
  (req, res, next) => quotationsController.createTemplate(req, res, next)
);

router.get("/templates/:id", authorizeRoles(Role.ADMIN, Role.STAFF), (req, res, next) =>
  quotationsController.getTemplate(req, res, next)
);

router.delete("/templates/:id", authorizeRoles(Role.ADMIN), (req, res, next) =>
  quotationsController.deleteTemplate(req, res, next)
);

// Quotations List & Detail
router.get("/", (req, res, next) => quotationsController.listQuotations(req, res, next));
router.get("/:id", (req, res, next) => quotationsController.getQuotation(req, res, next));

// Staff & Admin Quotation Lifecycle Operations
router.post(
  "/",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  validateRequest(createQuotationSchema),
  (req, res, next) => quotationsController.createQuotation(req, res, next)
);

router.patch(
  "/:id",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  validateRequest(updateQuotationSchema),
  (req, res, next) => quotationsController.updateQuotation(req, res, next)
);

router.post(
  "/:id/send",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  (req, res, next) => quotationsController.sendQuotation(req, res, next)
);

router.post("/:id/confirm", (req, res, next) =>
  quotationsController.confirmQuotation(req, res, next)
);

router.post(
  "/:id/cancel",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  (req, res, next) => quotationsController.cancelQuotation(req, res, next)
);

// Convert Quotation into Subscription Contract
router.post(
  "/:id/convert",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  validateRequest(convertQuotationSchema),
  (req, res, next) => quotationsController.convertToSubscription(req, res, next)
);

export default router;
