import { z } from "zod";

export const idParamSchema = z.object({ id: z.string().min(1) });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER", "INVENTORY", "ACCOUNTING", "TECHNICIAN"])
});

export const updateUserSchema = createUserSchema.partial().extend({
  isActive: z.boolean().optional()
});

export const stationSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  address: z.string().min(2),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const fuelTypeSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  unit: z.string().default("L"),
  unitPrice: z.coerce.number().positive(),
  isActive: z.boolean().optional()
});

export const pumpSchema = z.object({
  stationId: z.string().min(1),
  fuelTypeId: z.string().min(1),
  number: z.coerce.number().int().positive(),
  status: z.enum(["IDLE", "DISPENSING", "OFFLINE", "MAINTENANCE"]).optional()
});

export const inventoryMovementSchema = z.object({
  tankId: z.string().min(1),
  type: z.enum(["DELIVERY", "ADJUSTMENT"]),
  quantity: z.coerce.number().positive(),
  source: z.string().min(2),
  reference: z.string().optional()
});

export const openShiftSchema = z.object({
  stationId: z.string().min(1),
  userId: z.string().min(1),
  openingCash: z.coerce.number().nonnegative()
});

export const closeShiftSchema = z.object({
  closingCash: z.coerce.number().nonnegative()
});

export const createSaleSchema = z.object({
  stationId: z.string().min(1),
  pumpId: z.string().min(1),
  shiftId: z.string().min(1),
  liters: z.coerce.number().positive(),
  paymentType: z.enum(["CASH", "CARD", "FLEET"])
});

export const fiscalDocumentSchema = z.object({
  type: z.enum(["E_INVOICE", "E_ARCHIVE"]),
  saleId: z.string().optional(),
  customerName: z.string().min(2),
  taxNumber: z.string().optional(),
  documentNumber: z.string().optional(),
  payloadJson: z.string().optional()
});

export const eledgerRunSchema = z.object({
  period: z.string().min(4),
  mockFileRef: z.string().optional(),
  payloadJson: z.string().optional()
});

export const epdkReportSchema = z.object({
  stationId: z.string().min(1),
  period: z.string().min(4),
  payloadJson: z.string().optional()
});

export const okcReceiptSchema = z.object({
  saleId: z.string().min(1),
  deviceNo: z.string().min(2),
  receiptNo: z.string().optional(),
  payloadJson: z.string().optional()
});

export const bankTransactionSchema = z.object({
  bankName: z.string().min(2),
  transactionDate: z.coerce.date(),
  amount: z.coerce.number().positive(),
  description: z.string().min(2),
  payloadJson: z.string().optional()
});

export const journalEntrySchema = z.object({
  period: z.string().min(4),
  description: z.string().min(2),
  source: z.string().min(2),
  payloadJson: z.string().optional()
});

export const taxDeclarationSchema = z.object({
  type: z.enum(["VAT", "WITHHOLDING", "TEMPORARY"]),
  period: z.string().min(4),
  payloadJson: z.string().optional()
});
