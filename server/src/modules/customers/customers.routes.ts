import { Router } from "express";
import { Role } from "@prisma/client";
import { customersController } from "./customers.controller";
import { authenticateUser, authorizeRoles } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticateUser);

// Staff and Admin can list customers
router.get("/", authorizeRoles(Role.ADMIN, Role.STAFF), (req, res, next) =>
  customersController.listCustomers(req, res, next)
);

// Staff and Admin can create customers
router.post("/", authorizeRoles(Role.ADMIN, Role.STAFF), (req, res, next) =>
  customersController.createCustomer(req, res, next)
);

// Customer can view their own profile; Staff and Admin can view any
router.get("/:id", (req, res, next) =>
  customersController.getCustomer(req, res, next)
);

export default router;
