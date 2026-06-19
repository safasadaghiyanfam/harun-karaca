import type { PaymentType } from "@prisma/client";

export type IntegrationResult = {
  ok: boolean;
  reference: string;
  message: string;
};

export interface PaymentGateway {
  authorize(input: { amount: number; paymentType: PaymentType }): Promise<IntegrationResult>;
}

export interface PumpController {
  testConnection(pumpId: string): Promise<IntegrationResult>;
  authorizeDispense(input: { pumpId: string; liters: number }): Promise<IntegrationResult>;
}

export interface ErpAdapter {
  dryRunSaleExport(saleIds: string[]): Promise<IntegrationResult>;
}

export interface ETransformationAdapter {
  dryRunDocument(input: { saleId: string; documentType: "E_INVOICE" | "E_ARCHIVE" }): Promise<IntegrationResult>;
}

export interface EInvoiceAdapter {
  submit(input: { documentId: string; payloadJson?: string | null }): Promise<IntegrationResult>;
}

export interface EArchiveAdapter {
  submit(input: { documentId: string; payloadJson?: string | null }): Promise<IntegrationResult>;
}

export interface ELedgerAdapter {
  dryRun(input: { runId: string; period: string; payloadJson?: string | null }): Promise<IntegrationResult>;
}

export interface EpdkAdapter {
  dryRun(input: { reportId: string; period: string; payloadJson?: string | null }): Promise<IntegrationResult>;
}

export interface OkcAdapter {
  sendReceipt(input: { receiptId: string; payloadJson?: string | null }): Promise<IntegrationResult>;
}

export interface BankAdapter {
  reconcile(input: { transactionCount: number; matchedCount: number }): Promise<IntegrationResult>;
}

export interface AccountingAdapter {
  generateJournal(input: { saleCount: number; totalAmount: number }): Promise<IntegrationResult>;
}

export interface TaxDeclarationAdapter {
  dryRun(input: { declarationId: string; period: string; payloadJson?: string | null }): Promise<IntegrationResult>;
}
