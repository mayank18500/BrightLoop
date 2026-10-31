import { Router } from "express";
import { Role } from "@prisma/client";
import { subscriptionsController } from "./subscriptions.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  pauseSubscriptionSchema,
  resumeSubscriptionSchema,
  closeSubscriptionSchema,
  renewSubscriptionSchema,
  getSubscriptionsQuerySchema,
} from "./subscriptions.validation";

const router = Router();

router.use(authenticateUser);

// List & Detail (Customer IDOR isolated; Staff & Admin access all)
router.get("/", validateRequest(getSubscriptionsQuerySchema), (req, res, next) =>
  subscriptionsController.listSubscriptions(req, res, next)
);

router.get("/:id", (req, res, next) =>
  subscriptionsController.getSubscription(req, res, next)
);

// Staff & Admin Manual Contract Creation
router.post(
  "/",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  validateRequest(createSubscriptionSchema),
  (req, res, next) => subscriptionsController.createSubscription(req, res, next)
);

router.patch(
  "/:id",
  authorizeRoles(Role.ADMIN, Role.STAFF),
  validateRequest(updateSubscriptionSchema),
  (req, res, next) => subscriptionsController.updateSubscription(req, res, next)
);

// Lifecycle Operations
router.post(
  "/:id/pause",
  validateRequest(pauseSubscriptionSchema),
  (req, res, next) => subscriptionsController.pauseSubscription(req, res, next)
);

router.post(
  "/:id/resume",
  validateRequest(resumeSubscriptionSchema),
  (req, res, next) => subscriptionsController.resumeSubscription(req, res, next)
);

router.post(
  "/:id/close",
  validateRequest(closeSubscriptionSchema),
  (req, res, next) => subscriptionsController.closeSubscription(req, res, next)
);

router.post(
  "/:id/renew",
  validateRequest(renewSubscriptionSchema),
  (req, res, next) => subscriptionsController.renewSubscription(req, res, next)
);

export default router;
