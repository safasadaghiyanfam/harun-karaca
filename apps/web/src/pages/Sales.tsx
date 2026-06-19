import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Table } from "../components/Table";

export function Sales() {
  const client = useQueryClient();
  const { data: sales } = useQuery({ queryKey: ["sales"], queryFn: () => api("/sales") });
  const { data: stations } = useQuery({ queryKey: ["stations"], queryFn: () => api("/stations") });
  const { data: pumps } = useQuery({ queryKey: ["pumps"], queryFn: () => api("/pumps") });
  const { data: shifts } = useQuery({ queryKey: ["shifts"], queryFn: () => api("/shifts") });
  const [form, setForm] = useState({ stationId: "", pumpId: "", shiftId: "", liters: "10", paymentType: "CARD" });
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () => api("/sales", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      setMessage("Satis kaydi olusturuldu ve stoktan dusuldu.");
      client.invalidateQueries();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Satis basarisiz")
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <>
      <div className="page-title"><h1>Satis Islemleri</h1></div>
      <form className="form-grid panel" onSubmit={submit}>
        <select required value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })}>
          <option value="">Istasyon sec</option>
          {stations?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select required value={form.pumpId} onChange={(e) => setForm({ ...form, pumpId: e.target.value })}>
          <option value="">Pompa sec</option>
          {pumps?.map((p: any) => <option key={p.id} value={p.id}>Pompa {p.number} - {p.fuelType.name}</option>)}
        </select>
        <select required value={form.shiftId} onChange={(e) => setForm({ ...form, shiftId: e.target.value })}>
          <option value="">Acik vardiya sec</option>
          {shifts?.filter((s: any) => s.status === "OPEN").map((s: any) => <option key={s.id} value={s.id}>{s.user.name} - {s.station.name}</option>)}
        </select>
        <input value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} placeholder="Litre" />
        <select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })}>
          <option value="CARD">Kart</option><option value="CASH">Nakit</option><option value="FLEET">Filo</option>
        </select>
        <button>Mock satis olustur</button>
        {message && <p className="hint">{message}</p>}
      </form>
      <Table columns={["Tarih", "Yakit", "Litre", "Tutar", "Odeme"]} rows={(sales ?? []).map((sale: any) => ({
        Tarih: new Date(sale.createdAt).toLocaleString("tr-TR"),
        Yakit: sale.fuelType.name,
        Litre: Number(sale.liters).toLocaleString("tr-TR"),
        Tutar: `${Number(sale.total).toLocaleString("tr-TR")} TL`,
        Odeme: sale.paymentType
      }))} />
    </>
  );
}
