import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { Login } from "./pages/Login";
import { FiscalOperations } from "./pages/FiscalOperations";
import { Pumps } from "./pages/Pumps";
import { Reports } from "./pages/Reports";
import { Sales } from "./pages/Sales";
import { Shifts } from "./pages/Shifts";
import { Stations } from "./pages/Stations";
import { Users } from "./pages/Users";
import { Validation } from "./pages/Validation";

function ProtectedApp() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/shifts" element={<Shifts />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/pumps" element={<Pumps />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/fiscal" element={<FiscalOperations />} />
        <Route path="/validation" element={<Validation />} />
        <Route path="/users" element={<Users />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}
