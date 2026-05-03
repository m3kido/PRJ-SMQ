import { Route, Routes, Navigate } from "react-router-dom";
import LayoutShell from "./components/LayoutShell";
import DashboardPage from "./pages/DashboardPage";
import AdminWorkspacePage from "./pages/AdminWorkspacePage";
import GestionnaireWorkspacePage from "./pages/GestionnaireWorkspacePage";
import AuditeurWorkspacePage from "./pages/AuditeurWorkspacePage";
import ProcessSheetDetailPage from "./pages/ProcessSheetDetailPage";
import AuditExecutionPage from "./pages/AuditExecutionPage";
import AuditReportPage from "./pages/AuditReportPage";
import ProcessDetailPage from "./pages/ProcessDetailPage";
import CriteriaManagementPage from "./pages/CriteriaManagementPage";
import EvaluationScalesPage from "./pages/EvaluationScalesPage";
import AdministrationPage from "./pages/AdministrationPage";
import ProcessesPage from "./pages/ProcessesPage";
import AuditsPage from "./pages/AuditsPage";
import NonConformitiesPage from "./pages/NonConformitiesPage";
import ActionsPage from "./pages/ActionsPage";
import NotFoundPage from "./pages/NotFoundPage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";

function App() {
  const { auth } = useAuth();
  const isAuthed = Boolean(auth.accessToken);
  const roleHome =
    auth.role === "admin"
      ? <AdminWorkspacePage />
      : auth.role === "gestionnaire"
        ? <GestionnaireWorkspacePage />
        : auth.role === "auditeur_interne"
          ? <AuditeurWorkspacePage />
          : <DashboardPage />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          isAuthed ? (
            <LayoutShell>
              <Routes>
                <Route path="/" element={roleHome} />
                <Route path="/processes" element={<ProcessesPage />} />
                <Route path="/audits" element={<AuditsPage />} />
                <Route path="/non-conformities" element={<NonConformitiesPage />} />
                <Route path="/actions" element={<ActionsPage />} />
                <Route path="/criteria" element={<CriteriaManagementPage />} />
                <Route path="/evaluation-scales" element={<EvaluationScalesPage />} />
                <Route path="/administration" element={<AdministrationPage />} />
                <Route path="/processes/:id" element={<ProcessDetailPage />} />
                <Route path="/process-sheets/:id" element={<ProcessSheetDetailPage />} />
                <Route path="/audit-execution/:id" element={<AuditExecutionPage />} />
                <Route path="/audit-reports/:id" element={<AuditReportPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </LayoutShell>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
