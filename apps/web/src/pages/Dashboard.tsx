import { useQuery } from "@tanstack/react-query";
import { BadgeAlert, Banknote, ClipboardList, FileText, Fuel, Gauge, Landmark, ReceiptText } from "lucide-react";
import { api } from "../api/client";

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["summary"], queryFn: () => api("/reports/summary") });
  const { data: pumps } = useQuery({ queryKey: ["pumps"], queryFn: () => api("/pumps") });

  if (isLoading) return <p>Yukleniyor...</p>;

  const kpis = [
    { label: "Gunluk Ciro", value: `${data.totalRevenue.toLocaleString("tr-TR")} TL`, tone: "primary", icon: <Banknote size={18} />, meta: "Tamamlanan satis" },
    { label: "Satilan Litre", value: `${data.totalLiters.toLocaleString("tr-TR")} L`, tone: "success", icon: <Fuel size={18} />, meta: "Pompa cikisi" },
    { label: "Acik Vardiya", value: data.openShiftCount, tone: "info", icon: <Gauge size={18} />, meta: "Aktif kasa" },
    { label: "Kritik Tank", value: data.criticalTankCount, tone: data.criticalTankCount > 0 ? "danger" : "success", icon: <BadgeAlert size={18} />, meta: "Stok uyarisi" },
    { label: "Bekleyen Belge", value: data.pendingFiscalDocuments, tone: "warning", icon: <ReceiptText size={18} />, meta: "e-Donusum" },
    { label: "EPDK Taslak", value: data.epdkDrafts, tone: "warning", icon: <ClipboardList size={18} />, meta: "Rapor hazirligi" },
    { label: "Mutabakat Farki", value: data.unmatchedBankTransactions, tone: data.unmatchedBankTransactions > 0 ? "danger" : "success", icon: <Landmark size={18} />, meta: "Banka kontrolu" },
    { label: "Beyanname Taslagi", value: data.draftTaxDeclarations, tone: "warning", icon: <FileText size={18} />, meta: "Mali donem" }
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Operasyon Dashboard</h1>
          <p>Guvenlik, stok, raporlama ve entegrasyon sagligini tek ekranda izleyin.</p>
        </div>
      </div>
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <article key={kpi.label} className={`kpi-card ${kpi.tone}`}>
            <div className="kpi-top">
              <span>{kpi.label}</span>
              <i>{kpi.icon}</i>
            </div>
            <strong>{kpi.value}</strong>
            <small>{kpi.meta}</small>
          </article>
        ))}
      </div>
      <div className="panel-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>Pompa Durumu</h2>
            <span className="panel-kicker">Canli durum</span>
          </div>
          <div className="status-list">
            {pumps?.map((pump: any) => (
              <div key={pump.id} className="status-row">
                <span>Pompa {pump.number} - {pump.fuelType.name}</span>
                <strong className={`badge ${pump.status.toLowerCase()}`}>{pump.status}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>Tank Seviyeleri</h2>
            <span className="panel-kicker">Stok izleme</span>
          </div>
          <div className="status-list">
            {data.tanks.map((tank: any) => (
              <div key={tank.id} className="status-row">
                <span>{tank.name}</span>
                <strong>{Number(tank.currentLevel).toLocaleString("tr-TR")} L</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
