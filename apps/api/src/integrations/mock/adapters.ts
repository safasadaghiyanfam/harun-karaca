import type {
  AccountingAdapter,
  BankAdapter,
  EArchiveAdapter,
  ELedgerAdapter,
  EInvoiceAdapter,
  EpdkAdapter,
  ErpAdapter,
  ETransformationAdapter,
  OkcAdapter,
  PaymentGateway,
  PumpController,
  TaxDeclarationAdapter
} from "../interfaces.js";

function reference(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export class MockPaymentGateway implements PaymentGateway {
  async authorize(input: { amount: number; paymentType: "CASH" | "CARD" | "FLEET" }) {
    // TODO: replace mock adapter with real POS/pump/ERP implementation.
    if (input.amount <= 0) return { ok: false, reference: reference("PAY"), message: "Tutar gecersiz" };
    return { ok: true, reference: reference("PAY"), message: `${input.paymentType} odeme onaylandi` };
  }
}

export class MockPumpController implements PumpController {
  async testConnection(pumpId: string) {
    // TODO: replace mock adapter with real POS/pump/ERP implementation.
    return { ok: true, reference: reference("PUMP"), message: `${pumpId} pompasi erisilebilir` };
  }

  async authorizeDispense(input: { pumpId: string; liters: number }) {
    // TODO: replace mock adapter with real POS/pump/ERP implementation.
    if (input.liters > 500) return { ok: false, reference: reference("PUMP"), message: "Tek satis icin litre limiti asildi" };
    return { ok: true, reference: reference("PUMP"), message: `${input.pumpId} icin satis yetkilendirildi` };
  }
}

export class MockErpAdapter implements ErpAdapter {
  async dryRunSaleExport(saleIds: string[]) {
    // TODO: replace mock adapter with real POS/pump/ERP implementation.
    return { ok: true, reference: reference("ERP"), message: `${saleIds.length} satis ERP dry-run aktarimina hazir` };
  }
}

export class MockETransformationAdapter implements ETransformationAdapter {
  async dryRunDocument(input: { saleId: string; documentType: "E_INVOICE" | "E_ARCHIVE" }) {
    // TODO: replace mock adapter with real POS/pump/ERP implementation.
    return { ok: true, reference: reference("EDOC"), message: `${input.documentType} dry-run belge kontrolu tamamlandi` };
  }
}

export class MockEInvoiceAdapter implements EInvoiceAdapter {
  async submit(input: { documentId: string; payloadJson?: string | null }) {
    // TODO: replace mock adapter with real GIB e-Fatura provider implementation.
    return { ok: true, reference: reference("EINV"), message: `${input.documentId} e-Fatura mock gonderimi tamamlandi` };
  }
}

export class MockEArchiveAdapter implements EArchiveAdapter {
  async submit(input: { documentId: string; payloadJson?: string | null }) {
    // TODO: replace mock adapter with real GIB e-Arsiv provider implementation.
    return { ok: true, reference: reference("EARC"), message: `${input.documentId} e-Arsiv mock gonderimi tamamlandi` };
  }
}

export class MockELedgerAdapter implements ELedgerAdapter {
  async dryRun(input: { runId: string; period: string; payloadJson?: string | null }) {
    // TODO: replace mock adapter with real e-Defter/GIB berat service implementation.
    return { ok: true, reference: reference("ELEDGER"), message: `${input.period} e-Defter dry-run kontrolu tamamlandi` };
  }
}

export class MockEpdkAdapter implements EpdkAdapter {
  async dryRun(input: { reportId: string; period: string; payloadJson?: string | null }) {
    // TODO: replace mock adapter with real EPDK reporting service implementation.
    return { ok: true, reference: reference("EPDK"), message: `${input.period} EPDK raporu dry-run kontrolu tamamlandi` };
  }
}

export class MockOkcAdapter implements OkcAdapter {
  async sendReceipt(input: { receiptId: string; payloadJson?: string | null }) {
    // TODO: replace mock adapter with real OKC/fiscal device integration implementation.
    return { ok: true, reference: reference("OKC"), message: `${input.receiptId} OKC fisi mock olarak gonderildi` };
  }
}

export class MockBankAdapter implements BankAdapter {
  async reconcile(input: { transactionCount: number; matchedCount: number }) {
    // TODO: replace mock adapter with real bank statement/open banking implementation.
    return { ok: true, reference: reference("BANK"), message: `${input.matchedCount}/${input.transactionCount} banka hareketi mock mutabakat ile eslesti` };
  }
}

export class MockAccountingAdapter implements AccountingAdapter {
  async generateJournal(input: { saleCount: number; totalAmount: number }) {
    // TODO: replace mock adapter with real accounting/ERP posting implementation.
    return { ok: true, reference: reference("ACC"), message: `${input.saleCount} satis icin ${input.totalAmount.toFixed(2)} TL muhasebe taslagi uretildi` };
  }
}

export class MockTaxDeclarationAdapter implements TaxDeclarationAdapter {
  async dryRun(input: { declarationId: string; period: string; payloadJson?: string | null }) {
    // TODO: replace mock adapter with real tax declaration provider implementation.
    return { ok: true, reference: reference("TAX"), message: `${input.period} beyanname dry-run kontrolu tamamlandi` };
  }
}
