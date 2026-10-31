import { Router } from "express";
import { Role } from "@prisma/client";
import { plansController } from "./plans.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";
import { createPlanSchema, updatePlanSchema } from "./plans.validation";

const router = Router();

router.use(authenticateUser);

router.get("/", (req, res, next) => plansController.listPlans(req, res, next));
router.get("/:id", (req, res, next) => plansController.getPlan(req, res, next));

router.post(
  "/",
  authorizeRoles(Role.ADMIN),
  validateRequest(createPlanSchema),
  (req, res, next) => plansController.createPlan(req, res, next)
);

router.patch(
  "/:id",
  authorizeRoles(Role.ADMIN),
  validateRequest(updatePlanSchema),
  (req, res, next) => plansController.updatePlan(req, res, next)
);

router.delete(
  "/:id",
  authorizeRoles(Role.ADMIN),
  (req, res, next) => plansController.deletePlan(req, res, next)
);

export default router;
