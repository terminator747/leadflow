import React from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import {
  AuthProvider,
  useAuth
} from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard";

import Pipeline from "./pages/Pipeline";
import Leads from "./pages/Leads";
import Clients from "./pages/Clients";
import Documents from "./pages/Documents";
import Tasks from "./pages/Tasks";
import EmailTemplates from "./pages/EmailTemplates";


/*
|--------------------------------------------------------------------------
| Dashboard Router
|--------------------------------------------------------------------------
|
| Advisors / admins see the normal CRM dashboard.
|
| Clients see their own client dashboard.
|
*/

function DashboardRouter() {
  const { user } = useAuth();

  const role = String(
    user?.role || ""
  ).toLowerCase();

  if (role === "client") {
    return <ClientDashboard />;
  }

  return <Dashboard />;
}


/*
|--------------------------------------------------------------------------
| App
|--------------------------------------------------------------------------
*/

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <Routes>

          {/* -------------------------------------------------
              Public
          ------------------------------------------------- */}

          <Route
            path="/login"
            element={<Login />}
          />


          {/* -------------------------------------------------
              Protected application
          ------------------------------------------------- */}

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={<DashboardRouter />}
            />


            {/* Advisor / Admin workspace */}

            <Route
              path="/pipeline"
              element={<Pipeline />}
            />

            <Route
              path="/leads"
              element={<Leads />}
            />

            <Route
              path="/clients"
              element={<Clients />}
            />

            <Route
              path="/documents"
              element={<Documents />}
            />

            <Route
              path="/tasks"
              element={<Tasks />}
            />

            <Route
              path="/email-templates"
              element={<EmailTemplates />}
            />

          </Route>


          {/* -------------------------------------------------
              Unknown route
          ------------------------------------------------- */}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}