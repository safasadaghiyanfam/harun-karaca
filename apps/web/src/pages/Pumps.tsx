import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Table } from "../components/Table";

export function Pumps() {
  const { data } = useQuery({ queryKey: ["pumps"], queryFn: () => api("/pumps") });
  return (
    <>
      <div className="page-title"><h1>Pompa ve Yakit Tipleri</h1></div>
      <Table columns={["Pompa", "Istasyon", "Yakit", "Durum"]} rows={(data ?? []).map((p: any) => ({
        Pompa: p.number,
        Istasyon: p.station.name,
        Yakit: p.fuelType.name,
        Durum: <span className={`badge ${p.status.toLowerCase()}`}>{p.status}</span>
      }))} />
    </>
  );
}
