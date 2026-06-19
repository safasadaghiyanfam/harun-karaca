import type { FiscalDocumentType, IntegrationType, TaxDeclarationType } from "@prisma/client";
import { AppError } from "../errors.js";
import { integrations } from "../integrations/index.js";
import { prisma } from "../prisma.js";
import { audit } from "../repositories/auditRepository.js";
import type { AuthUser } from "../types.js";

function responseJson(result: { ok: boolean; reference: string; message: string }) {
  return JSON.stringify(result);
}

async function logIntegration(type: IntegrationType, result: { ok: boolean; reference: string; message: string }, requestSummary: unknown) {
  await prisma.integrationLog.create({
    data: {
      type,
      status: result.ok ? "SUCCESS" : "FAILURE",
      requestSummary: JSON.stringify(requestSummary),
      responseSummary: result.message,
      errorMessage: result.ok ? undefined : result.message
    }
  });
}

export async function getFiscalSummary() {
  const [pendingDocuments, epdkDrafts, unmatchedTransactions, draftDeclarations] = await Promise.all([
    prisma.fiscalDocument.count({ where: { status: { in: ["DRAFT", "READY"] } } }),
    prisma.epdkReport.count({ where: { status: { in: ["DRAFT", "READY"] } } }),
    prisma.bankTransaction.count({ where: { status: "UNMATCHED" } }),
    prisma.taxDeclaration.count({ where: { status: { in: ["DRAFT", "READY"] } } })
  ]);

  return { pendingDocuments, epdkDrafts, unmatchedTransactions, draftDeclarations };
}

export const fiscalDocuments = {
  list: () => prisma.fiscalDocument.findMany({ include: { sale: true }, orderBy: { createdAt: "desc" } }),
  create: async (input: { type: FiscalDocumentType; saleId?: string; customerName: string; taxNumber?: string; documentNumber?: string; payloadJson?: string }, actor?: AuthUser) => {
    const document = await prisma.fiscalDocument.create({ data: { ...input, status: "READY" } });
    await audit(actor?.id, "FISCAL_DOCUMENT_CREATED", "FiscalDocument", document.id, input);
    return document;
  },
  submit: async (id: string, actor?: AuthUser) => {
    const document = await prisma.fiscalDocument.findUnique({ where: { id } });
    if (!document) throw new AppError(404, "Mali belge bulunamadi");

    const adapter = document.type === "E_INVOICE" ? integrations.eInvoice : integrations.eArchive;
    const result = await adapter.submit({ documentId: id, payloadJson: document.payloadJson });
    await logIntegration(document.type, result, { id, type: document.type });

    const updated = await prisma.fiscalDocument.update({
      where: { id },
      data: {
        status: result.ok ? "SUBMITTED" : "FAILURE",
        responseJson: responseJson(result),
        documentNumber: document.documentNumber ?? result.reference
      }
    });
    await audit(actor?.id, "FISCAL_DOCUMENT_SUBMITTED", "FiscalDocument", id, result);
    return updated;
  }
};

export const eledgerRuns = {
  list: () => prisma.eledgerRun.findMany({ orderBy: { createdAt: "desc" } }),
  create: async (input: { period: string; mockFileRef?: string; payloadJson?: string }, actor?: AuthUser) => {
    const run = await prisma.eledgerRun.create({ data: { ...input, status: "DRAFT" } });
    await audit(actor?.id, "E_LEDGER_RUN_CREATED", "EledgerRun", run.id, input);
    return run;
  },
  dryRun: async (id: string, actor?: AuthUser) => {
    const run = await prisma.eledgerRun.findUnique({ where: { id } });
    if (!run) throw new AppError(404, "e-Defter calismasi bulunamadi");
    const result = await integrations.eLedger.dryRun({ runId: id, period: run.period, payloadJson: run.payloadJson });
    await logIntegration("E_LEDGER", result, { id, period: run.period });
    const updated = await prisma.eledgerRun.update({
      where: { id },
      data: { status: result.ok ? "DRY_RUN" : "FAILURE", responseJson: responseJson(result), mockFileRef: run.mockFileRef ?? result.reference }
    });
    await audit(actor?.id, "E_LEDGER_DRY_RUN", "EledgerRun", id, result);
    return updated;
  }
};

async function buildEpdkSummaries(stationId: string) {
  const [sales, tanks] = await Promise.all([
    prisma.sale.findMany({ where: { stationId, status: "COMPLETED" }, include: { fuelType: true } }),
    prisma.tank.findMany({ where: { stationId }, include: { fuelType: true } })
  ]);

  const salesSummary = sales.reduce<Record<string, { liters: number; total: number }>>((acc, sale) => {
    const key = sale.fuelType.code;
    acc[key] ??= { liters: 0, total: 0 };
    acc[key].liters += Number(sale.liters);
    acc[key].total += Number(sale.total);
    return acc;
  }, {});

  const inventorySummary = tanks.map((tank) => ({
    fuelCode: tank.fuelType.code,
    tank: tank.name,
    currentLevel: Number(tank.currentLevel),
    capacity: Number(tank.capacity)
  }));

  return { salesSummary, inventorySummary };
}

export const epdkReports = {
  list: () => prisma.epdkReport.findMany({ include: { station: true }, orderBy: { createdAt: "desc" } }),
  create: async (input: { stationId: string; period: string; payloadJson?: string }, actor?: AuthUser) => {
    const summaries = await buildEpdkSummaries(input.stationId);
    const report = await prisma.epdkReport.create({
      data: {
        stationId: input.stationId,
        period: input.period,
        payloadJson: input.payloadJson,
        salesSummaryJson: JSON.stringify(summaries.salesSummary),
        inventorySummaryJson: JSON.stringify(summaries.inventorySummary)
      }
    });
    await audit(actor?.id, "EPDK_REPORT_CREATED", "EpdkReport", report.id, input);
    return report;
  },
  dryRun: async (id: string, actor?: AuthUser) => {
    const report = await prisma.epdkReport.findUnique({ where: { id } });
    if (!report) throw new AppError(404, "EPDK raporu bulunamadi");
    const result = await integrations.epdk.dryRun({ reportId: id, period: report.period, payloadJson: report.payloadJson });
    await logIntegration("EPDK", result, { id, period: report.period });
    const updated = await prisma.epdkReport.update({ where: { id }, data: { status: result.ok ? "DRY_RUN" : "FAILURE", responseJson: responseJson(result) } });
    await audit(actor?.id, "EPDK_REPORT_DRY_RUN", "EpdkReport", id, result);
    return updated;
  }
};

export const okcReceipts = {
  list: () => prisma.okcReceipt.findMany({ include: { sale: true }, orderBy: { createdAt: "desc" } }),
  create: async (input: { saleId: string; deviceNo: string; receiptNo?: string; payloadJson?: string }, actor?: AuthUser) => {
    const receipt = await prisma.okcReceipt.create({ data: { ...input, status: "READY" } });
    await audit(actor?.id, "OKC_RECEIPT_CREATED", "OkcReceipt", receipt.id, input);
    return receipt;
  },
  send: async (id: string, actor?: AuthUser) => {
    const receipt = await prisma.okcReceipt.findUnique({ where: { id } });
    if (!receipt) throw new AppError(404, "OKC fisi bulunamadi");
    const result = await integrations.okc.sendReceipt({ receiptId: id, payloadJson: receipt.payloadJson });
    await logIntegration("OKC", result, { id, deviceNo: receipt.deviceNo });
    const updated = await prisma.okcReceipt.update({
      where: { id },
      data: { status: result.ok ? "SUBMITTED" : "FAILURE", responseJson: responseJson(result), receiptNo: receipt.receiptNo ?? result.reference }
    });
    await audit(actor?.id, "OKC_RECEIPT_SENT", "OkcReceipt", id, result);
    return updated;
  }
};

export const bankOperations = {
  listTransactions: () => prisma.bankTransaction.findMany({ include: { sale: true }, orderBy: { transactionDate: "desc" } }),
  createTransaction: async (input: { bankName: string; transactionDate: Date; amount: number; description: string; payloadJson?: string }, actor?: AuthUser) => {
    const tx = await prisma.bankTransaction.create({ data: input });
    await audit(actor?.id, "BANK_TRANSACTION_CREATED", "BankTransaction", tx.id, input);
    return tx;
  },
  runReconciliation: async (actor?: AuthUser) => {
    const transactions = await prisma.bankTransaction.findMany({ where: { status: "UNMATCHED" } });
    let matchedCount = 0;

    for (const tx of transactions) {
      const sale = await prisma.sale.findFirst({
        where: {
          status: "COMPLETED",
          total: Number(tx.amount),
          bankTransactions: { none: {} }
        }
      });

      if (sale) {
        matchedCount += 1;
        await prisma.bankTransaction.update({ where: { id: tx.id }, data: { status: "MATCHED", saleId: sale.id } });
        await prisma.bankReconciliation.create({
          data: { bankTransactionId: tx.id, saleId: sale.id, status: "MATCHED", differenceAmount: 0, notes: "Otomatik tutar eslesmesi" }
        });
      } else {
        await prisma.bankReconciliation.create({
          data: { bankTransactionId: tx.id, status: "UNMATCHED", differenceAmount: Number(tx.amount), notes: "Eslesen satis bulunamadi" }
        });
      }
    }

    const result = await integrations.bank.reconcile({ transactionCount: transactions.length, matchedCount });
    await logIntegration("BANK", result, { transactionCount: transactions.length, matchedCount });
    await audit(actor?.id, "BANK_RECONCILIATION_RUN", "BankReconciliation", undefined, result);
    return { ...result, transactionCount: transactions.length, matchedCount };
  }
};

async function ensureAccount(code: string, name: string, type: string) {
  return prisma.ledgerAccount.upsert({
    where: { code },
    update: { name, type, isActive: true },
    create: { code, name, type }
  });
}

export const accountingOperations = {
  listJournalEntries: () => prisma.journalEntry.findMany({ include: { lines: { include: { account: true } } }, orderBy: { createdAt: "desc" } }),
  createJournalEntry: async (input: { period: string; description: string; source: string; payloadJson?: string }, actor?: AuthUser) => {
    const entry = await prisma.journalEntry.create({ data: input });
    await audit(actor?.id, "JOURNAL_ENTRY_CREATED", "JournalEntry", entry.id, input);
    return entry;
  },
  generateFromSales: async (actor?: AuthUser) => {
    const sales = await prisma.sale.findMany({ where: { status: "COMPLETED" } });
    const totalAmount = Number(sales.reduce((sum, sale) => sum + Number(sale.total), 0).toFixed(2));
    if (totalAmount <= 0) throw new AppError(400, "Muhasebe fisi uretilecek satis bulunamadi");

    const taxAmount = Number((totalAmount * 0.18 / 1.18).toFixed(2));
    const revenueAmount = Number((totalAmount - taxAmount).toFixed(2));
    const [cashAccount, revenueAccount, vatAccount] = await Promise.all([
      ensureAccount("102", "Bankalar", "ASSET"),
      ensureAccount("600", "Yurt Ici Satislar", "REVENUE"),
      ensureAccount("391", "Hesaplanan KDV", "LIABILITY")
    ]);

    const result = await integrations.accounting.generateJournal({ saleCount: sales.length, totalAmount });
    await logIntegration("ACCOUNTING", result, { saleCount: sales.length, totalAmount });

    const entry = await prisma.journalEntry.create({
      data: {
        period: new Date().toISOString().slice(0, 7),
        description: "Satislardan otomatik muhasebe fisi",
        source: "sales-auto",
        responseJson: responseJson(result),
        lines: {
          create: [
            { accountId: cashAccount.id, debit: totalAmount, credit: 0, description: "POS/Nakit tahsilatlar" },
            { accountId: revenueAccount.id, debit: 0, credit: revenueAmount, description: "Akaryakit satis geliri" },
            { accountId: vatAccount.id, debit: 0, credit: taxAmount, description: "Hesaplanan KDV" }
          ]
        }
      },
      include: { lines: { include: { account: true } } }
    });
    await audit(actor?.id, "JOURNAL_ENTRY_GENERATED_FROM_SALES", "JournalEntry", entry.id, result);
    return entry;
  }
};

export const taxDeclarations = {
  list: () => prisma.taxDeclaration.findMany({ orderBy: { createdAt: "desc" } }),
  create: async (input: { type: TaxDeclarationType; period: string; payloadJson?: string }, actor?: AuthUser) => {
    const declaration = await prisma.taxDeclaration.create({ data: input });
    await audit(actor?.id, "TAX_DECLARATION_CREATED", "TaxDeclaration", declaration.id, input);
    return declaration;
  },
  dryRun: async (id: string, actor?: AuthUser) => {
    const declaration = await prisma.taxDeclaration.findUnique({ where: { id } });
    if (!declaration) throw new AppError(404, "Beyanname bulunamadi");
    const result = await integrations.taxDeclaration.dryRun({ declarationId: id, period: declaration.period, payloadJson: declaration.payloadJson });
    await logIntegration("TAX_DECLARATION", result, { id, period: declaration.period, type: declaration.type });
    const updated = await prisma.taxDeclaration.update({ where: { id }, data: { status: result.ok ? "DRY_RUN" : "FAILURE", responseJson: responseJson(result) } });
    await audit(actor?.id, "TAX_DECLARATION_DRY_RUN", "TaxDeclaration", id, result);
    return updated;
  }
};
