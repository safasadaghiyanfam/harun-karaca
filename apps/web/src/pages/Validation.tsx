import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function Validation() {
  const { data, refetch } = useQuery({ queryKey: ["system-check"], queryFn: () => api("/validation/system-check") });
  const pump = useMutation({ mutationFn: () => api("/integrations/pump/test", { method: "POST", body: JSON.stringify({ pumpId: "demo-pump" }) }) });
  const payment = useMutation({ mutationFn: () => api("/integrations/payment/test", { method: "POST", body: JSON.stringify({ amount: 100 }) }) });
  const erp = useMutation({ mutationFn: () => api("/integrations/erp/dry-run", { method: "POST" }) });

  return (
    <>
      <div className="page-title"><h1>Test ve Dogrulama Paneli</h1></div>
      <section className="panel">
        <h2>Sistem Kontrolleri</h2>
        <button className="small" onClick={() => refetch()}>Yenile</button>
        <div className="status-list">
          {data?.checks.map((check: any) => (
            <div className="status-row" key={check.name}>
              <span>{check.name}</span>
              <strong className={check.ok ? "ok" : "error"}>{check.ok ? "OK" : "HATA"} ({check.value})</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="panel-grid">
        <button onClick={() => pump.mutate()}>Mock pompa testi</button>
        <button onClick={() => payment.mutate()}>Mock odeme testi</button>
        <button onClick={() => erp.mutate()}>ERP dry-run</button>
      </section>
      {[pump.data, payment.data, erp.data].filter(Boolean).map((result: any) => (
        <p key={result.reference} className="hint">{result.reference}: {result.message}</p>
      ))}
    </>
  );
}
