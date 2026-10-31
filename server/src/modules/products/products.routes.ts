import { Router } from "express";
import { Role } from "@prisma/client";
import { productsController } from "./products.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";
import {
  createProductSchema,
  updateProductSchema,
  addVariantSchema,
  updateVariantSchema,
} from "./products.validation";

const router = Router();

// Viewing products is permitted for authenticated users
router.use(authenticateUser);

router.get("/", (req, res, next) => productsController.listProducts(req, res, next));
router.get("/:id", (req, res, next) => productsController.getProduct(req, res, next));

// Administrative operations
router.post(
  "/",
  authorizeRoles(Role.ADMIN),
  validateRequest(createProductSchema),
  (req, res, next) => productsController.createProduct(req, res, next)
);

router.patch(
  "/:id",
  authorizeRoles(Role.ADMIN),
  validateRequest(updateProductSchema),
  (req, res, next) => productsController.updateProduct(req, res, next)
);

router.delete(
  "/:id",
  authorizeRoles(Role.ADMIN),
  (req, res, next) => productsController.deleteProduct(req, res, next)
);

// Variant management
router.post(
  "/:id/variants",
  authorizeRoles(Role.ADMIN),
  validateRequest(addVariantSchema),
  (req, res, next) => productsController.addVariant(req, res, next)
);

router.patch(
  "/:productId/variants/:variantId",
  authorizeRoles(Role.ADMIN),
  validateRequest(updateVariantSchema),
  (req, res, next) => productsController.updateVariant(req, res, next)
);

router.delete(
  "/:productId/variants/:variantId",
  authorizeRoles(Role.ADMIN),
  (req, res, next) => productsController.deleteVariant(req, res, next)
);

export default router;
