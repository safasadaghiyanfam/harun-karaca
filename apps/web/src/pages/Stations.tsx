import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Table } from "../components/Table";

export function Stations() {
  const client = useQueryClient();
  const { data } = useQuery({ queryKey: ["stations"], queryFn: () => api("/stations") });
  const [form, setForm] = useState({ name: "", code: "", address: "" });
  const mutation = useMutation({ mutationFn: () => api("/stations", { method: "POST", body: JSON.stringify(form) }), onSuccess: () => client.invalidateQueries() });
  function submit(event: FormEvent) { event.preventDefault(); mutation.mutate(); }
  return (
    <>
      <div className="page-title"><h1>Istasyon Yonetimi</h1></div>
      <form className="form-grid panel" onSubmit={submit}>
        <input placeholder="Istasyon adi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Kod" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <input placeholder="Adres" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <button>Istasyon ekle</button>
      </form>
      <Table columns={["Ad", "Kod", "Adres", "Durum"]} rows={(data ?? []).map((s: any) => ({ Ad: s.name, Kod: s.code, Adres: s.address, Durum: s.status }))} />
    </>
  );
}
