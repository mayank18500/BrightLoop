import { Router } from "express";
import { Role } from "@prisma/client";
import { discountsController } from "./discounts.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";
import {
  createDiscountSchema,
  updateDiscountSchema,
  validateDiscountSchema,
} from "./discounts.validation";

const router = Router();

router.use(authenticateUser);

router.post("/validate", validateRequest(validateDiscountSchema), (req, res, next) =>
  discountsController.validateDiscount(req, res, next)
);

router.get("/", (req, res, next) => discountsController.listDiscounts(req, res, next));
router.get("/:id", (req, res, next) => discountsController.getDiscount(req, res, next));

router.post(
  "/",
  authorizeRoles(Role.ADMIN),
  validateRequest(createDiscountSchema),
  (req, res, next) => discountsController.createDiscount(req, res, next)
);

router.patch(
  "/:id",
  authorizeRoles(Role.ADMIN),
  validateRequest(updateDiscountSchema),
  (req, res, next) => discountsController.updateDiscount(req, res, next)
);

router.delete(
  "/:id",
  authorizeRoles(Role.ADMIN),
  (req, res, next) => discountsController.deleteDiscount(req, res, next)
);

export default router;
