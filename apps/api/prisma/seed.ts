import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  const passwordHash = await bcrypt.hash("Admin123!", 10);
  const managerHash = await bcrypt.hash("Manager123!", 10);
  const cashierHash = await bcrypt.hash("Cashier123!", 10);
  const accountingHash = await bcrypt.hash("Accounting123!", 10);

  const [admin, manager, cashier, accounting] = await Promise.all([
    prisma.user.create({ data: { name: "Demo Admin", email: "admin@demo.local", passwordHash, role: Role.ADMIN } }),
    prisma.user.create({ data: { name: "Istasyon Muduru", email: "manager@demo.local", passwordHash: managerHash, role: Role.MANAGER } }),
    prisma.user.create({ data: { name: "Kasa Personeli", email: "cashier@demo.local", passwordHash: cashierHash, role: Role.CASHIER } }),
    prisma.user.create({ data: { name: "Muhasebe Uzmani", email: "accounting@demo.local", passwordHash: accountingHash, role: Role.ACCOUNTING } })
  ]);

  const station = await prisma.station.create({
    data: { name: "Harun Karaca Demo Istasyonu", code: "HK-001", address: "Istanbul Anadolu Yakasi" }
  });

  const diesel = await prisma.fuelType.create({ data: { name: "Motorin", code: "DIESEL", unitPrice: 43.25 } });
  const gasoline = await prisma.fuelType.create({ data: { name: "Benzin 95", code: "GAS95", unitPrice: 45.1 } });
  const lpg = await prisma.fuelType.create({ data: { name: "LPG", code: "LPG", unitPrice: 23.4 } });

  const [dieselTank, gasolineTank, lpgTank] = await Promise.all([
    prisma.tank.create({ data: { stationId: station.id, fuelTypeId: diesel.id, name: "Tank-1 Motorin", capacity: 30000, currentLevel: 18600, criticalLevel: 4000 } }),
    prisma.tank.create({ data: { stationId: station.id, fuelTypeId: gasoline.id, name: "Tank-2 Benzin", capacity: 25000, currentLevel: 14200, criticalLevel: 3500 } }),
    prisma.tank.create({ data: { stationId: station.id, fuelTypeId: lpg.id, name: "Tank-3 LPG", capacity: 16000, currentLevel: 9800, criticalLevel: 2500 } })
  ]);

  const [pump1, pump2, pump3] = await Promise.all([
    prisma.pump.create({ data: { stationId: station.id, fuelTypeId: diesel.id, number: 1 } }),
    prisma.pump.create({ data: { stationId: station.id, fuelTypeId: gasoline.id, number: 2 } }),
    prisma.pump.create({ data: { stationId: station.id, fuelTypeId: lpg.id, number: 3 } })
  ]);

  await Promise.all([
    prisma.inventoryMovement.create({ data: { tankId: dieselTank.id, type: "DELIVERY", quantity: 18600, source: "seed", reference: "INITIAL" } }),
    prisma.inventoryMovement.create({ data: { tankId: gasolineTank.id, type: "DELIVERY", quantity: 14200, source: "seed", reference: "INITIAL" } }),
    prisma.inventoryMovement.create({ data: { tankId: lpgTank.id, type: "DELIVERY", quantity: 9800, source: "seed", reference: "INITIAL" } })
  ]);

  const shift = await prisma.shift.create({
    data: { stationId: station.id, userId: cashier.id, openingCash: 2500, status: "OPEN" }
  });

  const sale = await prisma.sale.create({
    data: {
      stationId: station.id,
      pumpId: pump1.id,
      shiftId: shift.id,
      fuelTypeId: diesel.id,
      liters: 38.5,
      unitPrice: 43.25,
      total: 1665.13,
      paymentType: "CARD"
    }
  });

  const [cashAccount, revenueAccount, vatAccount] = await Promise.all([
    prisma.ledgerAccount.create({ data: { code: "102", name: "Bankalar", type: "ASSET" } }),
    prisma.ledgerAccount.create({ data: { code: "600", name: "Yurt Ici Satislar", type: "REVENUE" } }),
    prisma.ledgerAccount.create({ data: { code: "391", name: "Hesaplanan KDV", type: "LIABILITY" } })
  ]);

  await prisma.fiscalDocument.create({
    data: {
      type: "E_INVOICE",
      status: "READY",
      saleId: sale.id,
      customerName: "Demo Musteri A.S.",
      taxNumber: "1234567890",
      documentNumber: "HK-EF-000001",
      payloadJson: JSON.stringify({ saleId: sale.id, total: 1665.13, source: "seed" })
    }
  });

  await prisma.okcReceipt.create({
    data: {
      saleId: sale.id,
      deviceNo: "OKC-HK-001",
      receiptNo: "OKC-000001",
      status: "READY",
      payloadJson: JSON.stringify({ saleId: sale.id, total: 1665.13, paymentType: "CARD" })
    }
  });

  const bankTransaction = await prisma.bankTransaction.create({
    data: {
      bankName: "Demo Bank",
      transactionDate: new Date(),
      amount: 1665.13,
      description: "POS tahsilati HK-001",
      payloadJson: JSON.stringify({ terminal: "POS-001", authCode: "MOCK123" })
    }
  });

  await prisma.bankReconciliation.create({
    data: {
      bankTransactionId: bankTransaction.id,
      saleId: sale.id,
      status: "MATCHED",
      differenceAmount: 0,
      notes: "Seed eslesmesi"
    }
  });

  await prisma.bankTransaction.update({ where: { id: bankTransaction.id }, data: { status: "MATCHED", saleId: sale.id } });

  await prisma.epdkReport.create({
    data: {
      stationId: station.id,
      period: "2026-06",
      status: "DRAFT",
      salesSummaryJson: JSON.stringify({ liters: 38.5, total: 1665.13 }),
      inventorySummaryJson: JSON.stringify({ dieselLevel: 18600, gasolineLevel: 14200, lpgLevel: 9800 })
    }
  });

  await prisma.eledgerRun.create({
    data: {
      period: "2026-06",
      status: "DRAFT",
      mockFileRef: "HK-EDEFTER-2026-06-DRAFT",
      payloadJson: JSON.stringify({ journalEntryCount: 1 })
    }
  });

  await prisma.journalEntry.create({
    data: {
      period: "2026-06",
      description: "Seed satis muhasebe fisi",
      source: "seed-sale",
      payloadJson: JSON.stringify({ saleId: sale.id }),
      lines: {
        create: [
          { accountId: cashAccount.id, debit: 1665.13, credit: 0, description: "POS tahsilati" },
          { accountId: revenueAccount.id, debit: 0, credit: 1411.13, description: "Akaryakit satis geliri" },
          { accountId: vatAccount.id, debit: 0, credit: 254, description: "Hesaplanan KDV" }
        ]
      }
    }
  });

  await prisma.taxDeclaration.create({
    data: {
      type: "VAT",
      period: "2026-06",
      status: "DRAFT",
      payloadJson: JSON.stringify({ taxableBase: 1411.13, vat: 254 })
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED_COMPLETED",
      entityType: "SYSTEM",
      metadata: JSON.stringify({ managerId: manager.id, accountingId: accounting.id, pump2Id: pump2.id, pump3Id: pump3.id })
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
