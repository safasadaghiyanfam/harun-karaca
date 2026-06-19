import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Table } from "../components/Table";

export function Shifts() {
  const client = useQueryClient();
  const { data: shifts } = useQuery({ queryKey: ["shifts"], queryFn: () => api("/shifts") });
  const { data: stations } = useQuery({ queryKey: ["stations"], queryFn: () => api("/stations") });
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: () => api("/users") });
  const [form, setForm] = useState({ stationId: "", userId: "", openingCash: "1000" });
  const openMutation = useMutation({ mutationFn: () => api("/shifts", { method: "POST", body: JSON.stringify(form) }), onSuccess: () => client.invalidateQueries() });
  const closeMutation = useMutation({ mutationFn: (id: string) => api(`/shifts/${id}/close`, { method: "POST", body: JSON.stringify({ closingCash: 2500 }) }), onSuccess: () => client.invalidateQueries() });

  function submit(event: FormEvent) {
    event.preventDefault();
    openMutation.mutate();
  }

  return (
    <>
      <div className="page-title"><h1>Vardiya Yonetimi</h1></div>
      <form className="form-grid panel" onSubmit={submit}>
        <select required value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })}>
          <option value="">Istasyon</option>{stations?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
          <option value="">Kullanici</option>{users?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input value={form.openingCash} onChange={(e) => setForm({ ...form, openingCash: e.target.value })} placeholder="Acilis nakit" />
        <button>Vardiya ac</button>
      </form>
      <Table columns={["Istasyon", "Kullanici", "Acilis", "Durum", "Islem"]} rows={(shifts ?? []).map((shift: any) => ({
        Istasyon: shift.station.name,
        Kullanici: shift.user.name,
        Acilis: new Date(shift.openedAt).toLocaleString("tr-TR"),
        Durum: shift.status,
        Islem: shift.status === "OPEN" ? <button className="small" onClick={() => closeMutation.mutate(shift.id)}>Kapat</button> : "-"
      }))} />
    </>
  );
}
