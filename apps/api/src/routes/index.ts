import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { login } from "../services/authService.js";
import { catalogService } from "../services/catalogService.js";
import { closeShift, createInventoryMovement, createSale, listSales, listShifts, listTanks, openShift } from "../services/operationsService.js";
import { erpDryRun, systemCheck, testPayment, testPump } from "../services/integrationService.js";
import { getInventoryReport, getSalesReport, getSummary } from "../services/reportService.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";
import { fiscalRouter } from "./fiscalRoutes.js";
import {
  closeShiftSchema,
  createSaleSchema,
  createUserSchema,
  fuelTypeSchema,
  idParamSchema,
  inventoryMovementSchema,
  loginSchema,
  openShiftSchema,
  pumpSchema,
  stationSchema,
  updateUserSchema
} from "../validation/schemas.js";

export const router = Router();

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (handler: AsyncRouteHandler) => (req: Request, res: Response, next: NextFunction) => {
  void handler(req, res, next).catch(next);
};

router.post("/auth/login", asyncHandler(async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    res.json(await login(input.email, input.password));
  } catch (error) {
    throw error;
  }
}));

router.get("/auth/me", requireAuth, (req, res) => res.json({ user: req.user }));

router.use(requireAuth);
router.use("/fiscal", fiscalRouter);

router.get("/users", requireRoles(Role.ADMIN, Role.MANAGER), asyncHandler(async (_req, res) => {
  res.json(await catalogService.users.list());
}));
router.post("/users", requireRoles(Role.ADMIN), asyncHandler(async (req, res) => {
  res.status(201).json(await catalogService.users.create(createUserSchema.parse(req.body), req.user));
}));
router.patch("/users/:id", requireRoles(Role.ADMIN), asyncHandler(async (req, res) => {
  res.json(await catalogService.users.update(idParamSchema.parse(req.params).id, updateUserSchema.parse(req.body), req.user));
}));

router.get("/stations", asyncHandler(async (_req, res) => {
  res.json(await catalogService.stations.list());
}));
router.post("/stations", requireRoles(Role.ADMIN, Role.MANAGER), asyncHandler(async (req, res) => {
  res.status(201).json(await catalogService.stations.create(stationSchema.parse(req.body), req.user));
}));
router.patch("/stations/:id", requireRoles(Role.ADMIN, Role.MANAGER), asyncHandler(async (req, res) => {
  res.json(await catalogService.stations.update(idParamSchema.parse(req.params).id, stationSchema.partial().parse(req.body), req.user));
}));

router.get("/fuel-types", asyncHandler(async (_req, res) => {
  res.json(await catalogService.fuelTypes.list());
}));
router.post("/fuel-types", requireRoles(Role.ADMIN, Role.MANAGER), asyncHandler(async (req, res) => {
  res.status(201).json(await catalogService.fuelTypes.create(fuelTypeSchema.parse(req.body), req.user));
}));
router.patch("/fuel-types/:id", requireRoles(Role.ADMIN, Role.MANAGER), asyncHandler(async (req, res) => {
  res.json(await catalogService.fuelTypes.update(idParamSchema.parse(req.params).id, fuelTypeSchema.partial().parse(req.body), req.user));
}));

router.get("/pumps", asyncHandler(async (_req, res) => {
  res.json(await catalogService.pumps.list());
}));
router.post("/pumps", requireRoles(Role.ADMIN, Role.MANAGER, Role.TECHNICIAN), asyncHandler(async (req, res) => {
  res.status(201).json(await catalogService.pumps.create(pumpSchema.parse(req.body), req.user));
}));
router.patch("/pumps/:id", requireRoles(Role.ADMIN, Role.MANAGER, Role.TECHNICIAN), asyncHandler(async (req, res) => {
  res.json(await catalogService.pumps.update(idParamSchema.parse(req.params).id, pumpSchema.partial().parse(req.body), req.user));
}));

router.get("/tanks", asyncHandler(async (_req, res) => {
  res.json(await listTanks());
}));
router.post("/inventory/movements", requireRoles(Role.ADMIN, Role.MANAGER, Role.INVENTORY), asyncHandler(async (req, res) => {
  res.status(201).json(await createInventoryMovement(inventoryMovementSchema.parse(req.body), req.user));
}));

router.get("/shifts", asyncHandler(async (_req, res) => {
  res.json(await listShifts());
}));
router.post("/shifts", requireRoles(Role.ADMIN, Role.MANAGER, Role.CASHIER), asyncHandler(async (req, res) => {
  res.status(201).json(await openShift(openShiftSchema.parse(req.body), req.user));
}));
router.post("/shifts/:id/close", requireRoles(Role.ADMIN, Role.MANAGER, Role.CASHIER), asyncHandler(async (req, res) => {
  res.json(await closeShift(idParamSchema.parse(req.params).id, closeShiftSchema.parse(req.body).closingCash, req.user));
}));

router.get("/sales", asyncHandler(async (_req, res) => {
  res.json(await listSales());
}));
router.post("/sales", requireRoles(Role.ADMIN, Role.MANAGER, Role.CASHIER), asyncHandler(async (req, res) => {
  res.status(201).json(await createSale(createSaleSchema.parse(req.body), req.user));
}));

router.get("/reports/summary", asyncHandler(async (_req, res) => {
  res.json(await getSummary());
}));
router.get("/reports/sales", asyncHandler(async (_req, res) => {
  res.json(await getSalesReport());
}));
router.get("/reports/inventory", asyncHandler(async (_req, res) => {
  res.json(await getInventoryReport());
}));

router.post("/integrations/pump/test", requireRoles(Role.ADMIN, Role.TECHNICIAN), asyncHandler(async (req, res) => {
  res.json(await testPump(String(req.body.pumpId ?? "demo-pump")));
}));
router.post("/integrations/payment/test", requireRoles(Role.ADMIN, Role.TECHNICIAN), asyncHandler(async (req, res) => {
  res.json(await testPayment(Number(req.body.amount ?? 100)));
}));
router.post("/integrations/erp/dry-run", requireRoles(Role.ADMIN, Role.ACCOUNTING, Role.TECHNICIAN), asyncHandler(async (_req, res) => {
  res.json(await erpDryRun());
}));
router.get("/validation/system-check", requireRoles(Role.ADMIN, Role.MANAGER, Role.TECHNICIAN), asyncHandler(async (_req, res) => {
  res.json(await systemCheck());
}));
