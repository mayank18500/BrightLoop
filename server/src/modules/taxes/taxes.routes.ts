import { Router } from "express";
import { Role } from "@prisma/client";
import { taxesController } from "./taxes.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";
import { createTaxRuleSchema, updateTaxRuleSchema } from "./taxes.validation";

const router = Router();

router.use(authenticateUser);

router.get("/", (req, res, next) => taxesController.listTaxRules(req, res, next));
router.get("/:id", (req, res, next) => taxesController.getTaxRule(req, res, next));

router.post(
  "/",
  authorizeRoles(Role.ADMIN),
  validateRequest(createTaxRuleSchema),
  (req, res, next) => taxesController.createTaxRule(req, res, next)
);

router.patch(
  "/:id",
  authorizeRoles(Role.ADMIN),
  validateRequest(updateTaxRuleSchema),
  (req, res, next) => taxesController.updateTaxRule(req, res, next)
);

router.delete(
  "/:id",
  authorizeRoles(Role.ADMIN),
  (req, res, next) => taxesController.deleteTaxRule(req, res, next)
);

export default router;
