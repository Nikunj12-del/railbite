import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useSocket } from "../hooks/useSocket";

function Navbar({
  user,
  connected,
  onLogout,
  onLogin,
  loggingOut,
  onMenuClick,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPantryLogin, setShowPantryLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [dark, setDark] = useState(
    () => localStorage.getItem("railbite-theme") === "dark"
  );

  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const userName = user?.fullName || "User";

  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("railbite-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const openPantryLogin = () => {
    setMenuOpen(false);
    setError("");
    setEmail("pantry@railbite.com");
    setPassword("pantry123");
    setShowPantryLogin(true);
  };

  const handlePantryLogin = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const loggedInUser = response.data.user;

      if (loggedInUser?.role !== "pantry_staff") {
        try {
          await api.post("/auth/logout");
        } catch (logoutError) {
          console.error("Could not clear login cookie:", logoutError);
        }

        setError(
          "Access denied: This account has the 'passenger' role. The Pantry Dashboard is reserved for pantry staff. Please use the pantry credentials (pantry@railbite.com / pantry123)."
        );
        return;
      }

      if (typeof onLogin !== "function") {
        setError(
          "Login succeeded, but the app could not update the session. Please try again."
        );
        console.error(
          "Navbar: onLogin callback was not passed from App.jsx."
        );
        return;
      }

      setShowPantryLogin(false);
      setMenuOpen(false);
      setPassword("");
      setError("");

      onLogin(loggedInUser);

      if (socket) {
        socket.disconnect();
        socket.connect();
      }

      navigate("/", { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to sign in. Please check your email and password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle sidebar"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-black text-white shadow-sm">
                R
              </span>

              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Rail<span className="text-indigo-600">Bite</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setDark((previous) => !previous)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span>{dark ? "☀️" : "🌙"}</span>
              <span className="hidden sm:inline">
                {dark ? "Light" : "Dark"}
              </span>
            </button>

            <div className="hidden items-center gap-2 rounded-full bg-slate-50 px-3 py-2 dark:bg-slate-900 sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {connected ? "Live connection" : "Connecting..."}
              </span>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-3 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {initials || "U"}
                </span>

                <span className="hidden max-w-36 truncate text-sm font-semibold text-slate-700 dark:text-slate-200 sm:block">
                  {userName}
                </span>

                <svg
                  className="h-4 w-4 text-slate-500 dark:text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m7 10 5 5 5-5"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {userName}
                    </p>

                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {user?.email}
                    </p>

                    <span className="mt-2 inline-block rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {user?.role?.replace("_", " ")}
                    </span>
                  </div>

                  {user?.role === "passenger" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/pantry");
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
                      >
                        Pantry Dashboard (Live Test)
                      </button>
                      <button
                        type="button"
                        onClick={openPantryLogin}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
                      >
                        Pantry Staff Login (Switch Account)
                      </button>
                    </>
                  )}

                  {user?.role === "pantry_staff" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/", { replace: true });
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
                    >
                      Pantry Dashboard
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onLogout}
                    disabled={loggingOut}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950"
                  >
                    {loggingOut ? "Signing out..." : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showPantryLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
                  🚆
                </div>

                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Pantry Staff Login
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Sign in with your pantry staff account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPantryLogin(false);
                  setError("");
                  setPassword("");
                }}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close login"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Seeded Pantry Staff Account
                  </p>
                  <p className="mt-0.5 text-xs text-indigo-700 dark:text-indigo-300">
                    pantry@railbite.com &bull; pantry123
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("pantry@railbite.com");
                    setPassword("pantry123");
                    setError("");
                  }}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Auto-Fill
                </button>
              </div>
            </div>

            <form onSubmit={handlePantryLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="pantry-email"
                  className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Email address
                </label>

                <input
                  id="pantry-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="staff@example.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-indigo-950"
                />
              </div>

              <div>
                <label
                  htmlFor="pantry-password"
                  className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Password
                </label>

                <input
                  id="pantry-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-indigo-950"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Enter Pantry Dashboard"}
              </button>

              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Only accounts registered with the pantry staff role can access
                the pantry dashboard.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
