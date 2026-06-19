import { PaymentType, PumpStatus } from "@prisma/client";
import { AppError } from "../errors.js";
import { integrations } from "../integrations/index.js";
import { prisma } from "../prisma.js";
import { audit } from "../repositories/auditRepository.js";
import type { AuthUser } from "../types.js";

export async function listTanks() {
  return prisma.tank.findMany({ include: { station: true, fuelType: true }, orderBy: { name: "asc" } });
}

export async function createInventoryMovement(input: any, actor?: AuthUser) {
  const movement = await prisma.$transaction(async (tx) => {
    const tank = await tx.tank.findUnique({ where: { id: input.tankId } });
    if (!tank) throw new AppError(404, "Tank bulunamadi");
    const nextLevel = Number(tank.currentLevel) + Number(input.quantity);
    if (nextLevel > Number(tank.capacity)) throw new AppError(400, "Tank kapasitesi asiliyor");
    const created = await tx.inventoryMovement.create({ data: input });
    await tx.tank.update({ where: { id: input.tankId }, data: { currentLevel: nextLevel } });
    return created;
  });
  await audit(actor?.id, "INVENTORY_MOVEMENT_CREATED", "InventoryMovement", movement.id, input);
  return movement;
}

export async function listShifts() {
  return prisma.shift.findMany({ include: { station: true, user: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { openedAt: "desc" } });
}

export async function openShift(input: any, actor?: AuthUser) {
  const existing = await prisma.shift.findFirst({ where: { stationId: input.stationId, userId: input.userId, status: "OPEN" } });
  if (existing) throw new AppError(409, "Bu kullanicinin acik vardiyasi var");
  const shift = await prisma.shift.create({ data: input });
  await audit(actor?.id, "SHIFT_OPENED", "Shift", shift.id, input);
  return shift;
}

export async function closeShift(id: string, closingCash: number, actor?: AuthUser) {
  const shift = await prisma.shift.update({ where: { id }, data: { closingCash, closedAt: new Date(), status: "CLOSED" } });
  await audit(actor?.id, "SHIFT_CLOSED", "Shift", shift.id, { closingCash });
  return shift;
}

export async function listSales() {
  return prisma.sale.findMany({
    include: { station: true, pump: true, fuelType: true, shift: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function createSale(input: { stationId: string; pumpId: string; shiftId: string; liters: number; paymentType: PaymentType }, actor?: AuthUser) {
  const pump = await prisma.pump.findUnique({ where: { id: input.pumpId }, include: { fuelType: true } });
  if (!pump) throw new AppError(404, "Pompa bulunamadi");
  if (pump.status !== PumpStatus.IDLE) throw new AppError(400, "Pompa satis icin uygun degil");

  const shift = await prisma.shift.findUnique({ where: { id: input.shiftId } });
  if (!shift || shift.status !== "OPEN") throw new AppError(400, "Acik vardiya gerekli");

  const tank = await prisma.tank.findFirst({ where: { stationId: input.stationId, fuelTypeId: pump.fuelTypeId } });
  if (!tank) throw new AppError(404, "Yakit tipi icin tank bulunamadi");
  if (Number(tank.currentLevel) < input.liters) throw new AppError(400, "Yetersiz stok");

  const unitPrice = Number(pump.fuelType.unitPrice);
  const total = Number((input.liters * unitPrice).toFixed(2));
  const pumpAuth = await integrations.pump.authorizeDispense({ pumpId: pump.id, liters: input.liters });
  await prisma.integrationLog.create({ data: { type: "PUMP", status: pumpAuth.ok ? "SUCCESS" : "FAILURE", requestSummary: JSON.stringify(input), responseSummary: pumpAuth.message } });
  if (!pumpAuth.ok) throw new AppError(400, pumpAuth.message);

  const payment = await integrations.payment.authorize({ amount: total, paymentType: input.paymentType });
  await prisma.integrationLog.create({ data: { type: "PAYMENT", status: payment.ok ? "SUCCESS" : "FAILURE", requestSummary: JSON.stringify({ total, paymentType: input.paymentType }), responseSummary: payment.message } });
  if (!payment.ok) throw new AppError(400, payment.message);

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        stationId: input.stationId,
        pumpId: input.pumpId,
        shiftId: input.shiftId,
        fuelTypeId: pump.fuelTypeId,
        liters: input.liters,
        unitPrice,
        total,
        paymentType: input.paymentType
      }
    });
    await tx.tank.update({ where: { id: tank.id }, data: { currentLevel: Number(tank.currentLevel) - input.liters } });
    await tx.inventoryMovement.create({ data: { tankId: tank.id, type: "SALE", quantity: -input.liters, source: "sale", reference: created.id } });
    return created;
  });

  await audit(actor?.id, "SALE_CREATED", "Sale", sale.id, { liters: input.liters, total });
  return sale;
}
