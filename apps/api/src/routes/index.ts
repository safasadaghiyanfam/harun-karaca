import { Router } from "express";
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

router.post("/auth/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    res.json(await login(input.email, input.password));
  } catch (error) {
    next(error);
  }
});

router.get("/auth/me", requireAuth, (req, res) => res.json({ user: req.user }));

router.use(requireAuth);
router.use("/fiscal", fiscalRouter);

router.get("/users", requireRoles(Role.ADMIN, Role.MANAGER), async (_req, res, next) => {
  try { res.json(await catalogService.users.list()); } catch (error) { next(error); }
});
router.post("/users", requireRoles(Role.ADMIN), async (req, res, next) => {
  try { res.status(201).json(await catalogService.users.create(createUserSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
router.patch("/users/:id", requireRoles(Role.ADMIN), async (req, res, next) => {
  try { res.json(await catalogService.users.update(idParamSchema.parse(req.params).id, updateUserSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});

router.get("/stations", async (_req, res, next) => {
  try { res.json(await catalogService.stations.list()); } catch (error) { next(error); }
});
router.post("/stations", requireRoles(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try { res.status(201).json(await catalogService.stations.create(stationSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
router.patch("/stations/:id", requireRoles(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try { res.json(await catalogService.stations.update(idParamSchema.parse(req.params).id, stationSchema.partial().parse(req.body), req.user)); } catch (error) { next(error); }
});

router.get("/fuel-types", async (_req, res, next) => {
  try { res.json(await catalogService.fuelTypes.list()); } catch (error) { next(error); }
});
router.post("/fuel-types", requireRoles(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try { res.status(201).json(await catalogService.fuelTypes.create(fuelTypeSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
router.patch("/fuel-types/:id", requireRoles(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try { res.json(await catalogService.fuelTypes.update(idParamSchema.parse(req.params).id, fuelTypeSchema.partial().parse(req.body), req.user)); } catch (error) { next(error); }
});

router.get("/pumps", async (_req, res, next) => {
  try { res.json(await catalogService.pumps.list()); } catch (error) { next(error); }
});
router.post("/pumps", requireRoles(Role.ADMIN, Role.MANAGER, Role.TECHNICIAN), async (req, res, next) => {
  try { res.status(201).json(await catalogService.pumps.create(pumpSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
router.patch("/pumps/:id", requireRoles(Role.ADMIN, Role.MANAGER, Role.TECHNICIAN), async (req, res, next) => {
  try { res.json(await catalogService.pumps.update(idParamSchema.parse(req.params).id, pumpSchema.partial().parse(req.body), req.user)); } catch (error) { next(error); }
});

router.get("/tanks", async (_req, res, next) => {
  try { res.json(await listTanks()); } catch (error) { next(error); }
});
router.post("/inventory/movements", requireRoles(Role.ADMIN, Role.MANAGER, Role.INVENTORY), async (req, res, next) => {
  try { res.status(201).json(await createInventoryMovement(inventoryMovementSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});

router.get("/shifts", async (_req, res, next) => {
  try { res.json(await listShifts()); } catch (error) { next(error); }
});
router.post("/shifts", requireRoles(Role.ADMIN, Role.MANAGER, Role.CASHIER), async (req, res, next) => {
  try { res.status(201).json(await openShift(openShiftSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
router.post("/shifts/:id/close", requireRoles(Role.ADMIN, Role.MANAGER, Role.CASHIER), async (req, res, next) => {
  try { res.json(await closeShift(idParamSchema.parse(req.params).id, closeShiftSchema.parse(req.body).closingCash, req.user)); } catch (error) { next(error); }
});

router.get("/sales", async (_req, res, next) => {
  try { res.json(await listSales()); } catch (error) { next(error); }
});
router.post("/sales", requireRoles(Role.ADMIN, Role.MANAGER, Role.CASHIER), async (req, res, next) => {
  try { res.status(201).json(await createSale(createSaleSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});

router.get("/reports/summary", async (_req, res, next) => {
  try { res.json(await getSummary()); } catch (error) { next(error); }
});
router.get("/reports/sales", async (_req, res, next) => {
  try { res.json(await getSalesReport()); } catch (error) { next(error); }
});
router.get("/reports/inventory", async (_req, res, next) => {
  try { res.json(await getInventoryReport()); } catch (error) { next(error); }
});

router.post("/integrations/pump/test", requireRoles(Role.ADMIN, Role.TECHNICIAN), async (req, res, next) => {
  try { res.json(await testPump(String(req.body.pumpId ?? "demo-pump"))); } catch (error) { next(error); }
});
router.post("/integrations/payment/test", requireRoles(Role.ADMIN, Role.TECHNICIAN), async (req, res, next) => {
  try { res.json(await testPayment(Number(req.body.amount ?? 100))); } catch (error) { next(error); }
});
router.post("/integrations/erp/dry-run", requireRoles(Role.ADMIN, Role.ACCOUNTING, Role.TECHNICIAN), async (_req, res, next) => {
  try { res.json(await erpDryRun()); } catch (error) { next(error); }
});
router.get("/validation/system-check", requireRoles(Role.ADMIN, Role.MANAGER, Role.TECHNICIAN), async (_req, res, next) => {
  try { res.json(await systemCheck()); } catch (error) { next(error); }
});
