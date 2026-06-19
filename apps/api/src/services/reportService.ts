import { prisma } from "../prisma.js";

export async function getSummary() {
  const [sales, tanks, pumps, openShifts, pendingFiscalDocuments, epdkDrafts, unmatchedBankTransactions, draftTaxDeclarations] = await Promise.all([
    prisma.sale.findMany({ where: { status: "COMPLETED" } }),
    prisma.tank.findMany({ include: { fuelType: true } }),
    prisma.pump.findMany(),
    prisma.shift.findMany({ where: { status: "OPEN" } }),
    prisma.fiscalDocument.count({ where: { status: { in: ["DRAFT", "READY"] } } }),
    prisma.epdkReport.count({ where: { status: { in: ["DRAFT", "READY"] } } }),
    prisma.bankTransaction.count({ where: { status: "UNMATCHED" } }),
    prisma.taxDeclaration.count({ where: { status: { in: ["DRAFT", "READY"] } } })
  ]);

  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const totalLiters = sales.reduce((sum, sale) => sum + Number(sale.liters), 0);
  const criticalTanks = tanks.filter((tank) => Number(tank.currentLevel) <= Number(tank.criticalLevel));

  return {
    totalRevenue,
    totalLiters,
    saleCount: sales.length,
    pumpCount: pumps.length,
    openShiftCount: openShifts.length,
    criticalTankCount: criticalTanks.length,
    pendingFiscalDocuments,
    epdkDrafts,
    unmatchedBankTransactions,
    draftTaxDeclarations,
    tanks
  };
}

export async function getSalesReport() {
  const sales = await prisma.sale.findMany({ include: { fuelType: true }, orderBy: { createdAt: "desc" } });
  return sales.map((sale) => ({
    id: sale.id,
    date: sale.createdAt,
    fuelType: sale.fuelType.name,
    liters: Number(sale.liters),
    total: Number(sale.total),
    paymentType: sale.paymentType
  }));
}

export async function getInventoryReport() {
  const tanks = await prisma.tank.findMany({ include: { fuelType: true, station: true } });
  return tanks.map((tank) => ({
    station: tank.station.name,
    tank: tank.name,
    fuelType: tank.fuelType.name,
    capacity: Number(tank.capacity),
    currentLevel: Number(tank.currentLevel),
    fillRate: Number(tank.currentLevel) / Number(tank.capacity),
    isCritical: Number(tank.currentLevel) <= Number(tank.criticalLevel)
  }));
}
