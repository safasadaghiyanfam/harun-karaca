import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Table } from "../components/Table";

export function Inventory() {
  const client = useQueryClient();
  const { data: tanks } = useQuery({ queryKey: ["tanks"], queryFn: () => api("/tanks") });
  const [form, setForm] = useState({ tankId: "", type: "DELIVERY", quantity: "1000", source: "manual", reference: "" });
  const mutation = useMutation({
    mutationFn: () => api("/inventory/movements", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => client.invalidateQueries()
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <>
      <div className="page-title"><h1>Stok Takibi</h1></div>
      <form className="form-grid panel" onSubmit={submit}>
        <select required value={form.tankId} onChange={(e) => setForm({ ...form, tankId: e.target.value })}>
          <option value="">Tank sec</option>
          {tanks?.map((tank: any) => <option key={tank.id} value={tank.id}>{tank.name}</option>)}
        </select>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="DELIVERY">Dolum</option><option value="ADJUSTMENT">Duzeltme</option>
        </select>
        <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Miktar" />
        <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Referans" />
        <button>Stok hareketi ekle</button>
      </form>
      {mutation.error && <p className="error">{mutation.error instanceof Error ? mutation.error.message : "Hata"}</p>}
      <Table columns={["Istasyon", "Tank", "Yakit", "Seviye", "Kapasite", "Durum"]} rows={(tanks ?? []).map((tank: any) => ({
        Istasyon: tank.station.name,
        Tank: tank.name,
        Yakit: tank.fuelType.name,
        Seviye: `${Number(tank.currentLevel).toLocaleString("tr-TR")} L`,
        Kapasite: `${Number(tank.capacity).toLocaleString("tr-TR")} L`,
        Durum: Number(tank.currentLevel) <= Number(tank.criticalLevel) ? "Kritik" : "Normal"
      }))} />
    </>
  );
}
