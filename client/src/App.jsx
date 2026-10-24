import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PantryDashboard from "./pages/PantryDashboard";
import Menu from "./pages/FoodMenu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/MyOrders";

import DashboardLayout from "./layouts/DashboardLayout";
import { CartProvider } from "./context/CartContext";
import { SocketProvider } from "./hooks/useSocket";
import api from "./services/api";

function AppContent() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const response = await api.get("/auth/me");
        const loggedInUser = response.data.user || response.data;

        if (mounted && loggedInUser?.role) {
          setUser(loggedInUser);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SocketProvider user={user}>
      {checkingAuth ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
        </div>
      ) : !user ? (
        showRegister ? (
          <Register
            onRegister={() => {
              setShowRegister(false);
            }}
            onLoginClick={() => setShowRegister(false)}
            onRegistrationSuccess={(email) => {
              setRegisteredEmail(email || "");
              setShowRegister(false);
            }}
            onLogin={setUser}
          />
        ) : (
          <Login
            onLogin={setUser}
            onRegisterClick={() => setShowRegister(true)}
            initialEmail={registeredEmail}
          />
        )
      ) : (
        <Routes>
          <Route
            element={
              <DashboardLayout
                user={user}
                onLogout={() => setUser(null)}
                onLogin={setUser}
              />
            }
          >
            <Route
              index
              element={
                user?.role === "pantry_staff" ? (
                  <PantryDashboard />
                ) : (
                  <Dashboard />
                )
              }
            />

            {user?.role === "passenger" ? (
              <>
                <Route path="menu" element={<Menu />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders" element={<Orders />} />
              </>
            ) : null}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </SocketProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
