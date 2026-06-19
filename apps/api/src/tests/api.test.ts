import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { app } from "../app.js";
import { prisma } from "../prisma.js";

let token = "";
let accountingToken = "";
let cashierToken = "";
let stationId = "";
let pumpId = "";
let shiftId = "";
let tankId = "";
let saleId = "";

beforeAll(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.integrationLog.deleteMany();
  await prisma.bankReconciliation.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.journalEntryLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.ledgerAccount.deleteMany();
  await prisma.taxDeclaration.deleteMany();
  await prisma.okcReceipt.deleteMany();
  await prisma.epdkReport.deleteMany();
  await prisma.eledgerRun.deleteMany();
  await prisma.fiscalDocument.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.pump.deleteMany();
  await prisma.tank.deleteMany();
  await prisma.fuelType.deleteMany();
  await prisma.station.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: { name: "Test Admin", email: "admin@test.local", passwordHash: await bcrypt.hash("Admin123!", 10), role: "ADMIN" }
  });
  await prisma.user.create({
    data: { name: "Test Accounting", email: "accounting@test.local", passwordHash: await bcrypt.hash("Accounting123!", 10), role: "ACCOUNTING" }
  });
  await prisma.user.create({
    data: { name: "Test Cashier", email: "cashier@test.local", passwordHash: await bcrypt.hash("Cashier123!", 10), role: "CASHIER" }
  });
  const station = await prisma.station.create({ data: { name: "Test Station", code: "TST", address: "Test" } });
  const fuel = await prisma.fuelType.create({ data: { name: "Motorin", code: "TD", unitPrice: 40 } });
  const tank = await prisma.tank.create({ data: { stationId: station.id, fuelTypeId: fuel.id, name: "Tank", capacity: 1000, currentLevel: 500, criticalLevel: 100 } });
  const pump = await prisma.pump.create({ data: { stationId: station.id, fuelTypeId: fuel.id, number: 1 } });
  const shift = await prisma.shift.create({ data: { stationId: station.id, userId: user.id, openingCash: 100 } });

  stationId = station.id;
  pumpId = pump.id;
  shiftId = shift.id;
  tankId = tank.id;
});

describe("API", () => {
  it("logs in and returns a token", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: "admin@test.local", password: "Admin123!" });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    token = response.body.token;

    const accounting = await request(app).post("/api/auth/login").send({ email: "accounting@test.local", password: "Accounting123!" });
    expect(accounting.status).toBe(200);
    accountingToken = accounting.body.token;

    const cashier = await request(app).post("/api/auth/login").send({ email: "cashier@test.local", password: "Cashier123!" });
    expect(cashier.status).toBe(200);
    cashierToken = cashier.body.token;
  });

  it("rejects unauthenticated catalog access", async () => {
    const response = await request(app).get("/api/users");
    expect(response.status).toBe(401);
  });

  it("creates a sale and reduces inventory", async () => {
    const before = await prisma.tank.findUniqueOrThrow({ where: { id: tankId } });
    const response = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ stationId, pumpId, shiftId, liters: 10, paymentType: "CARD" });

    expect(response.status).toBe(201);
    expect(Number(response.body.total)).toBe(400);
    saleId = response.body.id;
    const after = await prisma.tank.findUniqueOrThrow({ where: { id: tankId } });
    expect(Number(after.currentLevel)).toBe(Number(before.currentLevel) - 10);
  });

  it("blocks sales with insufficient stock", async () => {
    const response = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ stationId, pumpId, shiftId, liters: 99999, paymentType: "CARD" });
    expect(response.status).toBe(400);
  });

  it("runs validation checks", async () => {
    const response = await request(app).get("/api/validation/system-check").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it("allows accounting users and blocks cashiers from fiscal records", async () => {
    const accounting = await request(app).get("/api/fiscal/documents").set("Authorization", `Bearer ${accountingToken}`);
    expect(accounting.status).toBe(200);

    const cashier = await request(app).get("/api/fiscal/documents").set("Authorization", `Bearer ${cashierToken}`);
    expect(cashier.status).toBe(403);
  });

  it("submits e-invoice mock documents and writes integration logs", async () => {
    const created = await request(app)
      .post("/api/fiscal/documents")
      .set("Authorization", `Bearer ${accountingToken}`)
      .send({ type: "E_INVOICE", saleId, customerName: "Test Musteri", taxNumber: "1234567890" });
    expect(created.status).toBe(201);

    const submitted = await request(app)
      .post(`/api/fiscal/documents/${created.body.id}/submit`)
      .set("Authorization", `Bearer ${accountingToken}`);
    expect(submitted.status).toBe(200);
    expect(submitted.body.status).toBe("SUBMITTED");

    const logs = await prisma.integrationLog.count({ where: { type: "E_INVOICE" } });
    expect(logs).toBeGreaterThan(0);
  });

  it("creates and dry-runs EPDK reports from station data", async () => {
    const created = await request(app)
      .post("/api/fiscal/epdk-reports")
      .set("Authorization", `Bearer ${accountingToken}`)
      .send({ stationId, period: "2026-06" });
    expect(created.status).toBe(201);
    expect(created.body.salesSummaryJson).toContain("TD");

    const dryRun = await request(app)
      .post(`/api/fiscal/epdk-reports/${created.body.id}/dry-run`)
      .set("Authorization", `Bearer ${accountingToken}`);
    expect(dryRun.status).toBe(200);
    expect(dryRun.body.status).toBe("DRY_RUN");
  });

  it("sends OKC mock receipts", async () => {
    const created = await request(app)
      .post("/api/fiscal/okc-receipts")
      .set("Authorization", `Bearer ${accountingToken}`)
      .send({ saleId, deviceNo: "OKC-TEST-001" });
    expect(created.status).toBe(201);

    const sent = await request(app)
      .post(`/api/fiscal/okc-receipts/${created.body.id}/send`)
      .set("Authorization", `Bearer ${accountingToken}`);
    expect(sent.status).toBe(200);
    expect(sent.body.status).toBe("SUBMITTED");
  });

  it("matches bank transactions against sales", async () => {
    const created = await request(app)
      .post("/api/fiscal/bank-transactions")
      .set("Authorization", `Bearer ${accountingToken}`)
      .send({ bankName: "Test Bank", transactionDate: new Date().toISOString(), amount: 400, description: "POS test" });
    expect(created.status).toBe(201);

    const reconciliation = await request(app)
      .post("/api/fiscal/reconciliations/run")
      .set("Authorization", `Bearer ${accountingToken}`);
    expect(reconciliation.status).toBe(200);
    expect(reconciliation.body.matchedCount).toBeGreaterThan(0);
  });

  it("generates balanced journal entries from sales", async () => {
    const response = await request(app)
      .post("/api/fiscal/journal-entries/generate-from-sales")
      .set("Authorization", `Bearer ${accountingToken}`);
    expect(response.status).toBe(200);

    const debit = response.body.lines.reduce((sum: number, line: any) => sum + Number(line.debit), 0);
    const credit = response.body.lines.reduce((sum: number, line: any) => sum + Number(line.credit), 0);
    expect(debit).toBeCloseTo(credit, 2);
  });

  it("dry-runs tax declarations", async () => {
    const created = await request(app)
      .post("/api/fiscal/tax-declarations")
      .set("Authorization", `Bearer ${accountingToken}`)
      .send({ type: "VAT", period: "2026-06", payloadJson: JSON.stringify({ taxableBase: 338.98, vat: 61.02 }) });
    expect(created.status).toBe(201);

    const dryRun = await request(app)
      .post(`/api/fiscal/tax-declarations/${created.body.id}/dry-run`)
      .set("Authorization", `Bearer ${accountingToken}`);
    expect(dryRun.status).toBe(200);
    expect(dryRun.body.status).toBe("DRY_RUN");
  });
});
