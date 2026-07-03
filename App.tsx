import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "./state/AppContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Deals } from "./pages/Deals";
import { Portfolio } from "./pages/Portfolio";
import { ServicesTree } from "./pages/ServicesTree";
import { Assets } from "./pages/Assets";
import { Employees } from "./pages/Employees";
import { EmployeesRoles } from "./pages/EmployeesRoles";
import { EmployeesPerformance } from "./pages/EmployeesPerformance";
import { HRDashboard } from "./pages/HRDashboard";
import { FinanceDashboard } from "./pages/FinanceDashboard";
import { VendorsDashboard } from "./pages/VendorsDashboard";
import { Marketing } from "./pages/Marketing";
import { Opportunities } from "./pages/Opportunities";
import { SupplyChains } from "./pages/SupplyChains";
import { QuotationDetail } from "./pages/QuotationDetail";
import type { Role } from "./types";
import { Clients } from "./pages/Clients";
import { ClientDetail } from "./pages/ClientDetail";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Tasks } from "./pages/Tasks";
import { TasksBoard } from "./pages/TasksBoard";
import { Vendors } from "./pages/Vendors";
import { VendorDetail } from "./pages/VendorDetail";
import { Invoices } from "./pages/Invoices";
import { InvoiceDetail } from "./pages/InvoiceDetail";
import { ContractDetail } from "./pages/ContractDetail";
import { Settings } from "./pages/Settings";

const Protected: React.FC<{ children: React.ReactNode; roles?: Role[] }> = ({
  children,
  roles,
}) => {
  const { isAuthenticated, currentUser } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useApp();
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/deals"
        element={
          <Protected>
            <Deals />
          </Protected>
        }
      />
      <Route
        path="/portfolio"
        element={
          <Protected>
            <Portfolio />
          </Protected>
        }
      />
      <Route
        path="/services-tree"
        element={
          <Protected roles={["owner"]}>
            <ServicesTree />
          </Protected>
        }
      />
      <Route
        path="/assets"
        element={
          <Protected roles={["owner", "admin"]}>
            <Assets />
          </Protected>
        }
      />
      <Route
        path="/employees"
        element={
          <Protected roles={["owner", "admin"]}>
            <Employees />
          </Protected>
        }
      />
      <Route
        path="/hr"
        element={
          <Protected roles={["owner", "admin"]}>
            <HRDashboard />
          </Protected>
        }
      />
      <Route
        path="/employees-roles"
        element={
          <Protected roles={["owner", "admin"]}>
            <EmployeesRoles />
          </Protected>
        }
      />
      <Route
        path="/employees-performance"
        element={
          <Protected roles={["owner", "admin"]}>
            <EmployeesPerformance />
          </Protected>
        }
      />
      <Route
        path="/finance"
        element={
          <Protected>
            <FinanceDashboard />
          </Protected>
        }
      />
      <Route
        path="/vendors-overview"
        element={
          <Protected>
            <VendorsDashboard />
          </Protected>
        }
      />
      <Route
        path="/marketing"
        element={
          <Protected>
            <Marketing />
          </Protected>
        }
      />
      <Route
        path="/opportunities"
        element={
          <Protected>
            <Opportunities />
          </Protected>
        }
      />
      <Route
        path="/supply-chains"
        element={
          <Protected>
            <SupplyChains />
          </Protected>
        }
      />
      <Route
        path="/quotations/:id"
        element={
          <Protected>
            <QuotationDetail />
          </Protected>
        }
      />
      <Route
        path="/clients"
        element={
          <Protected>
            <Clients />
          </Protected>
        }
      />
      <Route
        path="/clients/:id"
        element={
          <Protected>
            <ClientDetail />
          </Protected>
        }
      />
      <Route
        path="/projects"
        element={
          <Protected>
            <Projects />
          </Protected>
        }
      />
      <Route
        path="/projects-list"
        element={
          <Protected>
            <Projects showTasks={false} />
          </Protected>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <Protected>
            <ProjectDetail />
          </Protected>
        }
      />
      <Route
        path="/tasks"
        element={
          <Protected>
            <Tasks />
          </Protected>
        }
      />
      <Route
        path="/tasks-board"
        element={
          <Protected>
            <TasksBoard />
          </Protected>
        }
      />
      <Route
        path="/vendors"
        element={
          <Protected>
            <Vendors />
          </Protected>
        }
      />
      <Route
        path="/vendors/:id"
        element={
          <Protected>
            <VendorDetail />
          </Protected>
        }
      />
      <Route
        path="/invoices"
        element={
          <Protected>
            <Invoices initialTab="invoices" />
          </Protected>
        }
      />
      <Route
        path="/quotations"
        element={
          <Protected>
            <Invoices initialTab="quotations" />
          </Protected>
        }
      />
      <Route
        path="/contracts-list"
        element={
          <Protected>
            <Invoices initialTab="contracts" />
          </Protected>
        }
      />
      <Route
        path="/purchases"
        element={
          <Protected>
            <Invoices initialTab="purchases" />
          </Protected>
        }
      />
      <Route
        path="/invoices/:id"
        element={
          <Protected>
            <InvoiceDetail />
          </Protected>
        }
      />
      <Route
        path="/contracts/:id"
        element={
          <Protected>
            <ContractDetail />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <Settings />
          </Protected>
        }
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppRoutes />
  </AppProvider>
);

export default App;
