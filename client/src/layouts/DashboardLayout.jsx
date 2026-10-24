import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useSocket } from "../hooks/useSocket";
import api from "../services/api";

function DashboardLayout({ user, onLogout, onLogin }) {
  const { connected } = useSocket();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(
        "Logout request failed:",
        error.response?.data?.message || error.message
      );
    } finally {
      onLogout();
      navigate("/", { replace: true });
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar
        user={user}
        connected={connected}
        onLogout={handleLogout}
        onLogin={onLogin}
        loggingOut={loggingOut}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        <Sidebar
          user={user}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1 p-4 transition-colors duration-300 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
