import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Table } from "../components/Table";

export function Reports() {
  const { data: sales } = useQuery({ queryKey: ["sales-report"], queryFn: () => api("/reports/sales") });
  const { data: inventory } = useQuery({ queryKey: ["inventory-report"], queryFn: () => api("/reports/inventory") });
  return (
    <>
      <div className="page-title"><h1>Raporlama</h1><p>Satış ve stok KPI takibi.</p></div>
      <section className="panel">
        <h2>Satis Raporu</h2>
        <Table columns={["Tarih", "Yakit", "Litre", "Tutar", "Odeme"]} rows={(sales ?? []).map((s: any) => ({
          Tarih: new Date(s.date).toLocaleString("tr-TR"),
          Yakit: s.fuelType,
          Litre: s.liters,
          Tutar: `${s.total} TL`,
          Odeme: s.paymentType
        }))} />
      </section>
      <section className="panel">
        <h2>Stok Raporu</h2>
        <Table columns={["Istasyon", "Tank", "Yakit", "Doluluk", "Durum"]} rows={(inventory ?? []).map((i: any) => ({
          Istasyon: i.station,
          Tank: i.tank,
          Yakit: i.fuelType,
          Doluluk: `${Math.round(i.fillRate * 100)}%`,
          Durum: i.isCritical ? "Kritik" : "Normal"
        }))} />
      </section>
    </>
  );
}
