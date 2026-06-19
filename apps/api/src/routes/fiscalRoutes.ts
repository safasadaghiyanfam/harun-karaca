import { Router } from "express";
import { Role } from "@prisma/client";
import {
  accountingOperations,
  bankOperations,
  eledgerRuns,
  epdkReports,
  fiscalDocuments,
  getFiscalSummary,
  okcReceipts,
  taxDeclarations
} from "../services/fiscalService.js";
import { requireRoles } from "../middleware/auth.js";
import {
  bankTransactionSchema,
  eledgerRunSchema,
  epdkReportSchema,
  fiscalDocumentSchema,
  idParamSchema,
  journalEntrySchema,
  okcReceiptSchema,
  taxDeclarationSchema
} from "../validation/schemas.js";

export const fiscalRouter = Router();

const fiscalReadRoles = [Role.ADMIN, Role.MANAGER, Role.ACCOUNTING] as const;
const fiscalActionRoles = [Role.ADMIN, Role.MANAGER, Role.ACCOUNTING] as const;
const fiscalDryRunRoles = [Role.ADMIN, Role.MANAGER, Role.ACCOUNTING, Role.TECHNICIAN] as const;

fiscalRouter.get("/summary", requireRoles(...fiscalReadRoles), async (_req, res, next) => {
  try { res.json(await getFiscalSummary()); } catch (error) { next(error); }
});

fiscalRouter.get("/documents", requireRoles(...fiscalReadRoles), async (_req, res, next) => {
  try { res.json(await fiscalDocuments.list()); } catch (error) { next(error); }
});
fiscalRouter.post("/documents", requireRoles(...fiscalActionRoles), async (req, res, next) => {
  try { res.status(201).json(await fiscalDocuments.create(fiscalDocumentSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
fiscalRouter.post("/documents/:id/submit", requireRoles(...fiscalDryRunRoles), async (req, res, next) => {
  try { res.json(await fiscalDocuments.submit(idParamSchema.parse(req.params).id, req.user)); } catch (error) { next(error); }
});

fiscalRouter.get("/e-ledger-runs", requireRoles(...fiscalReadRoles), async (_req, res, next) => {
  try { res.json(await eledgerRuns.list()); } catch (error) { next(error); }
});
fiscalRouter.post("/e-ledger-runs", requireRoles(...fiscalActionRoles), async (req, res, next) => {
  try { res.status(201).json(await eledgerRuns.create(eledgerRunSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
fiscalRouter.post("/e-ledger-runs/:id/dry-run", requireRoles(...fiscalDryRunRoles), async (req, res, next) => {
  try { res.json(await eledgerRuns.dryRun(idParamSchema.parse(req.params).id, req.user)); } catch (error) { next(error); }
});

fiscalRouter.get("/epdk-reports", requireRoles(...fiscalReadRoles), async (_req, res, next) => {
  try { res.json(await epdkReports.list()); } catch (error) { next(error); }
});
fiscalRouter.post("/epdk-reports", requireRoles(...fiscalActionRoles), async (req, res, next) => {
  try { res.status(201).json(await epdkReports.create(epdkReportSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
fiscalRouter.post("/epdk-reports/:id/dry-run", requireRoles(...fiscalDryRunRoles), async (req, res, next) => {
  try { res.json(await epdkReports.dryRun(idParamSchema.parse(req.params).id, req.user)); } catch (error) { next(error); }
});

fiscalRouter.get("/okc-receipts", requireRoles(...fiscalReadRoles), async (_req, res, next) => {
  try { res.json(await okcReceipts.list()); } catch (error) { next(error); }
});
fiscalRouter.post("/okc-receipts", requireRoles(...fiscalActionRoles), async (req, res, next) => {
  try { res.status(201).json(await okcReceipts.create(okcReceiptSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
fiscalRouter.post("/okc-receipts/:id/send", requireRoles(...fiscalDryRunRoles), async (req, res, next) => {
  try { res.json(await okcReceipts.send(idParamSchema.parse(req.params).id, req.user)); } catch (error) { next(error); }
});

fiscalRouter.get("/bank-transactions", requireRoles(...fiscalReadRoles), async (_req, res, next) => {
  try { res.json(await bankOperations.listTransactions()); } catch (error) { next(error); }
});
fiscalRouter.post("/bank-transactions", requireRoles(...fiscalActionRoles), async (req, res, next) => {
  try { res.status(201).json(await bankOperations.createTransaction(bankTransactionSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
fiscalRouter.post("/reconciliations/run", requireRoles(...fiscalActionRoles), async (req, res, next) => {
  try { res.json(await bankOperations.runReconciliation(req.user)); } catch (error) { next(error); }
});

fiscalRouter.get("/journal-entries", requireRoles(...fiscalReadRoles), async (_req, res, next) => {
  try { res.json(await accountingOperations.listJournalEntries()); } catch (error) { next(error); }
});
fiscalRouter.post("/journal-entries", requireRoles(...fiscalActionRoles), async (req, res, next) => {
  try { res.status(201).json(await accountingOperations.createJournalEntry(journalEntrySchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
fiscalRouter.post("/journal-entries/generate-from-sales", requireRoles(...fiscalActionRoles), async (req, res, next) => {
  try { res.json(await accountingOperations.generateFromSales(req.user)); } catch (error) { next(error); }
});

fiscalRouter.get("/tax-declarations", requireRoles(...fiscalReadRoles), async (_req, res, next) => {
  try { res.json(await taxDeclarations.list()); } catch (error) { next(error); }
});
fiscalRouter.post("/tax-declarations", requireRoles(...fiscalActionRoles), async (req, res, next) => {
  try { res.status(201).json(await taxDeclarations.create(taxDeclarationSchema.parse(req.body), req.user)); } catch (error) { next(error); }
});
fiscalRouter.post("/tax-declarations/:id/dry-run", requireRoles(...fiscalDryRunRoles), async (req, res, next) => {
  try { res.json(await taxDeclarations.dryRun(idParamSchema.parse(req.params).id, req.user)); } catch (error) { next(error); }
});
