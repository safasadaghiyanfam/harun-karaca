import { integrations } from "../integrations/index.js";
import { prisma } from "../prisma.js";

export async function testPump(pumpId: string) {
  const result = await integrations.pump.testConnection(pumpId);
  await prisma.integrationLog.create({ data: { type: "PUMP", status: result.ok ? "SUCCESS" : "FAILURE", requestSummary: pumpId, responseSummary: result.message } });
  return result;
}

export async function testPayment(amount: number) {
  const result = await integrations.payment.authorize({ amount, paymentType: "CARD" });
  await prisma.integrationLog.create({ data: { type: "PAYMENT", status: result.ok ? "SUCCESS" : "FAILURE", requestSummary: String(amount), responseSummary: result.message } });
  return result;
}

export async function erpDryRun() {
  const saleIds = (await prisma.sale.findMany({ select: { id: true }, take: 25 })).map((sale) => sale.id);
  const result = await integrations.erp.dryRunSaleExport(saleIds);
  await prisma.integrationLog.create({ data: { type: "ERP", status: "DRY_RUN", requestSummary: JSON.stringify(saleIds), responseSummary: result.message } });
  return result;
}

export async function systemCheck() {
  const [users, stations, pumps, tanks, openShifts] = await Promise.all([
    prisma.user.count(),
    prisma.station.count(),
    prisma.pump.count(),
    prisma.tank.count(),
    prisma.shift.count({ where: { status: "OPEN" } })
  ]);

  return {
    ok: users > 0 && stations > 0 && pumps > 0 && tanks > 0,
    checks: [
      { name: "Kullanici seed", ok: users > 0, value: users },
      { name: "Istasyon seed", ok: stations > 0, value: stations },
      { name: "Pompa konfigurasyonu", ok: pumps > 0, value: pumps },
      { name: "Tank konfigurasyonu", ok: tanks > 0, value: tanks },
      { name: "Acik vardiya", ok: openShifts > 0, value: openShifts }
    ]
  };
}
