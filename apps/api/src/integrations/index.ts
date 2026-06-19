import {
  MockAccountingAdapter,
  MockBankAdapter,
  MockEArchiveAdapter,
  MockELedgerAdapter,
  MockEInvoiceAdapter,
  MockEpdkAdapter,
  MockErpAdapter,
  MockETransformationAdapter,
  MockOkcAdapter,
  MockPaymentGateway,
  MockPumpController,
  MockTaxDeclarationAdapter
} from "./mock/adapters.js";

export const integrations = {
  payment: new MockPaymentGateway(),
  pump: new MockPumpController(),
  erp: new MockErpAdapter(),
  eTransformation: new MockETransformationAdapter(),
  eInvoice: new MockEInvoiceAdapter(),
  eArchive: new MockEArchiveAdapter(),
  eLedger: new MockELedgerAdapter(),
  epdk: new MockEpdkAdapter(),
  okc: new MockOkcAdapter(),
  bank: new MockBankAdapter(),
  accounting: new MockAccountingAdapter(),
  taxDeclaration: new MockTaxDeclarationAdapter()
};
