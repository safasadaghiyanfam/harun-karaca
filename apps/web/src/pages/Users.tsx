import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Table } from "../components/Table";

export function Users() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: () => api("/users") });
  return (
    <>
      <div className="page-title"><h1>Kullanici ve Rol Yonetimi</h1></div>
      <Table columns={["Ad", "E-posta", "Rol", "Durum"]} rows={(data ?? []).map((user: any) => ({
        Ad: user.name,
        "E-posta": user.email,
        Rol: user.role,
        Durum: user.isActive ? "Aktif" : "Pasif"
      }))} />
    </>
  );
}
