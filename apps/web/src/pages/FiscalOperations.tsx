import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Table } from "../components/Table";

const tabs = [
  "e-Fatura / e-Arsiv",
  "e-Defter",
  "EPDK Raporlama",
  "OKC Entegrasyonu",
  "Banka Mutabakati",
  "Genel Muhasebe",
  "Beyanname"
] as const;

function parseResponse(value?: string | null) {
  if (!value) return "-";
  try {
    const parsed = JSON.parse(value);
    const message = parsed.message ?? value;
    return String(message).length > 90 ? `${String(message).slice(0, 90)}...` : message;
  } catch {
    return value.length > 90 ? `${value.slice(0, 90)}...` : value;
  }
}

function Status({ value }: { value: string }) {
  return <span className={`badge ${value.toLowerCase()}`}>{value}</span>;
}

export function FiscalOperations() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("e-Fatura / e-Arsiv");
  const client = useQueryClient();
  const documents = useQuery({ queryKey: ["fiscal-documents"], queryFn: () => api("/fiscal/documents") });
  const eledger = useQuery({ queryKey: ["e-ledger-runs"], queryFn: () => api("/fiscal/e-ledger-runs") });
  const epdk = useQuery({ queryKey: ["epdk-reports"], queryFn: () => api("/fiscal/epdk-reports") });
  const okc = useQuery({ queryKey: ["okc-receipts"], queryFn: () => api("/fiscal/okc-receipts") });
  const bank = useQuery({ queryKey: ["bank-transactions"], queryFn: () => api("/fiscal/bank-transactions") });
  const journals = useQuery({ queryKey: ["journal-entries"], queryFn: () => api("/fiscal/journal-entries") });
  const declarations = useQuery({ queryKey: ["tax-declarations"], queryFn: () => api("/fiscal/tax-declarations") });

  const invalidateFiscal = () => client.invalidateQueries();
  const submitDocument = useMutation({ mutationFn: (id: string) => api(`/fiscal/documents/${id}/submit`, { method: "POST" }), onSuccess: invalidateFiscal });
  const dryRunLedger = useMutation({ mutationFn: (id: string) => api(`/fiscal/e-ledger-runs/${id}/dry-run`, { method: "POST" }), onSuccess: invalidateFiscal });
  const dryRunEpdk = useMutation({ mutationFn: (id: string) => api(`/fiscal/epdk-reports/${id}/dry-run`, { method: "POST" }), onSuccess: invalidateFiscal });
  const sendOkc = useMutation({ mutationFn: (id: string) => api(`/fiscal/okc-receipts/${id}/send`, { method: "POST" }), onSuccess: invalidateFiscal });
  const runReconciliation = useMutation({ mutationFn: () => api("/fiscal/reconciliations/run", { method: "POST" }), onSuccess: invalidateFiscal });
  const generateJournal = useMutation({ mutationFn: () => api("/fiscal/journal-entries/generate-from-sales", { method: "POST" }), onSuccess: invalidateFiscal });
  const dryRunDeclaration = useMutation({ mutationFn: (id: string) => api(`/fiscal/tax-declarations/${id}/dry-run`, { method: "POST" }), onSuccess: invalidateFiscal });

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Mali Operasyonlar</h1>
          <p>e-Donusum, EPDK, OKC, banka, muhasebe ve beyanname entegrasyon hazirligi.</p>
        </div>
        <span className="page-badge">Mock entegrasyon modu</span>
      </div>
      <div className="tabs">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "tab active" : "tab"} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      {activeTab === "e-Fatura / e-Arsiv" && (
        <section className="panel">
          <div className="panel-title">
            <h2>e-Fatura / e-Arsiv</h2>
            <span className="panel-kicker">GIB adapter hazirligi</span>
          </div>
          <Table columns={["Tip", "Musteri", "Belge No", "Durum", "Son Yanit", "Islem"]} rows={(documents.data ?? []).map((doc: any) => ({
            Tip: doc.type,
            Musteri: doc.customerName,
            "Belge No": doc.documentNumber ?? "-",
            Durum: <Status value={doc.status} />,
            "Son Yanit": parseResponse(doc.responseJson),
            Islem: <button className="small" onClick={() => submitDocument.mutate(doc.id)}>Mock gonder</button>
          }))} />
        </section>
      )}

      {activeTab === "e-Defter" && (
        <section className="panel">
          <div className="panel-title">
            <h2>e-Defter Otomasyonu</h2>
            <span className="panel-kicker">Donemsel dry-run</span>
          </div>
          <Table columns={["Donem", "Berat/Ref", "Durum", "Son Yanit", "Islem"]} rows={(eledger.data ?? []).map((run: any) => ({
            Donem: run.period,
            "Berat/Ref": run.mockFileRef ?? "-",
            Durum: <Status value={run.status} />,
            "Son Yanit": parseResponse(run.responseJson),
            Islem: <button className="small" onClick={() => dryRunLedger.mutate(run.id)}>Dry-run</button>
          }))} />
        </section>
      )}

      {activeTab === "EPDK Raporlama" && (
        <section className="panel">
          <div className="panel-title">
            <h2>EPDK Raporlama</h2>
            <span className="panel-kicker">Stok ve satis ozeti</span>
          </div>
          <Table columns={["Istasyon", "Donem", "Durum", "Satis Ozeti", "Son Yanit", "Islem"]} rows={(epdk.data ?? []).map((report: any) => ({
            Istasyon: report.station.name,
            Donem: report.period,
            Durum: <Status value={report.status} />,
            "Satis Ozeti": report.salesSummaryJson ?? "-",
            "Son Yanit": parseResponse(report.responseJson),
            Islem: <button className="small" onClick={() => dryRunEpdk.mutate(report.id)}>Dry-run</button>
          }))} />
        </section>
      )}

      {activeTab === "OKC Entegrasyonu" && (
        <section className="panel">
          <div className="panel-title">
            <h2>OKC Entegrasyonu</h2>
            <span className="panel-kicker">Fiscal cihaz gonderimi</span>
          </div>
          <Table columns={["Cihaz", "Fis No", "Satis", "Durum", "Son Yanit", "Islem"]} rows={(okc.data ?? []).map((receipt: any) => ({
            Cihaz: receipt.deviceNo,
            "Fis No": receipt.receiptNo ?? "-",
            Satis: `${Number(receipt.sale.total).toLocaleString("tr-TR")} TL`,
            Durum: <Status value={receipt.status} />,
            "Son Yanit": parseResponse(receipt.responseJson),
            Islem: <button className="small" onClick={() => sendOkc.mutate(receipt.id)}>Mock gonder</button>
          }))} />
        </section>
      )}

      {activeTab === "Banka Mutabakati" && (
        <section className="panel">
          <div className="section-head">
            <h2>Banka Mutabakati</h2>
            <button className="small" onClick={() => runReconciliation.mutate()}>Mutabakat calistir</button>
          </div>
          {runReconciliation.data && <p className="hint">{runReconciliation.data.message}</p>}
          <Table columns={["Banka", "Tarih", "Tutar", "Aciklama", "Durum"]} rows={(bank.data ?? []).map((tx: any) => ({
            Banka: tx.bankName,
            Tarih: new Date(tx.transactionDate).toLocaleDateString("tr-TR"),
            Tutar: `${Number(tx.amount).toLocaleString("tr-TR")} TL`,
            Aciklama: tx.description,
            Durum: <Status value={tx.status} />
          }))} />
        </section>
      )}

      {activeTab === "Genel Muhasebe" && (
        <section className="panel">
          <div className="section-head">
            <h2>Genel Muhasebe</h2>
            <button className="small" onClick={() => generateJournal.mutate()}>Satistan fis uret</button>
          </div>
          <Table columns={["Donem", "Aciklama", "Kaynak", "Durum", "Satir"]} rows={(journals.data ?? []).map((entry: any) => ({
            Donem: entry.period,
            Aciklama: entry.description,
            Kaynak: entry.source,
            Durum: <Status value={entry.status} />,
            Satir: entry.lines.map((line: any) => `${line.account.code} ${line.account.name}: B ${Number(line.debit)} / A ${Number(line.credit)}`).join(" | ")
          }))} />
        </section>
      )}

      {activeTab === "Beyanname" && (
        <section className="panel">
          <div className="panel-title">
            <h2>Beyanname</h2>
            <span className="panel-kicker">Vergi donemi kontrolu</span>
          </div>
          <Table columns={["Tip", "Donem", "Durum", "Son Yanit", "Islem"]} rows={(declarations.data ?? []).map((declaration: any) => ({
            Tip: declaration.type,
            Donem: declaration.period,
            Durum: <Status value={declaration.status} />,
            "Son Yanit": parseResponse(declaration.responseJson),
            Islem: <button className="small" onClick={() => dryRunDeclaration.mutate(declaration.id)}>Dry-run</button>
          }))} />
        </section>
      )}
    </>
  );
}
