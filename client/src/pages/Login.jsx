
import { useEffect, useState } from "react";
import api from "../services/api";
import { useSocket } from "../hooks/useSocket";

function Login({
    onLogin,
    onRegisterClick,
    initialEmail = ""
}) {
    const [email, setEmail] = useState(initialEmail || "");
    const [password, setPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resetSuccess, setResetSuccess] = useState("");

    const { reconnectSocket } = useSocket();

    useEffect(() => {
        if (initialEmail) {
            setEmail(initialEmail);
            setPassword("");
            setError("");
        }
    }, [initialEmail]);

    const handleFillDemo = () => {
        setEmail("passenger.test@example.com");
        setPassword("test123456");
        setError("");
        setIsResetting(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError("");
        setResetSuccess("");

        try {
            const response = await api.post("/auth/login", {
                email: email.trim().toLowerCase(),
                password
            });

            reconnectSocket();

            onLogin(response.data.user || { email });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError("");
        setResetSuccess("");

        try {
            const response = await api.post("/auth/reset-password", {
                email: email.trim().toLowerCase(),
                newPassword
            });

            reconnectSocket();

            if (response.data.user) {
                onLogin(response.data.user);
            } else {
                setResetSuccess("Password reset successfully. Please sign in.");
                setIsResetting(false);
                setPassword(newPassword);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to reset password. Please verify your email."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
                <section className="flex flex-col justify-between bg-gradient-to-br from-blue-700 to-slate-950 p-8 text-white sm:p-12">
                    <div>
                        <div className="mb-10 flex items-center gap-3">
                            <span className="text-4xl">🚆</span>
                            <span className="text-2xl font-black">
                                RailBite
                            </span>
                        </div>

                        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-200">
                            Good food. On track.
                        </p>

                        <h1 className="text-4xl font-black leading-tight">
                            Delicious meals, delivered to your seat.
                        </h1>

                        <p className="mt-5 leading-7 text-blue-100">
                            Order your favourite food from the pantry
                            while enjoying your train journey.
                        </p>
                    </div>

                    <p className="mt-10 text-sm text-blue-200">
                        Your journey. Your food. Your comfort.
                    </p>
                </section>

                <section className="p-8 sm:p-12">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black text-slate-900">
                            {isResetting ? "Reset Password" : "Welcome aboard!"}
                        </h2>
                        {!isResetting && (
                            <button
                                type="button"
                                onClick={handleFillDemo}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                                Fill Demo Passenger
                            </button>
                        )}
                    </div>

                    <p className="mt-2 text-slate-500">
                        {isResetting
                            ? "Set a new password for your passenger account."
                            : "Sign in to your passenger account."}
                    </p>

                    {resetSuccess && (
                        <p
                            role="status"
                            className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700"
                        >
                            {resetSuccess}
                        </p>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                        >
                            <p>{error}</p>
                            {!isResetting && error.toLowerCase().includes("invalid") && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsResetting(true);
                                        setError("");
                                        setResetSuccess("");
                                    }}
                                    className="mt-2 block text-xs font-bold text-blue-700 underline hover:text-blue-900"
                                >
                                    Forgot your password? Click here to reset it
                                </button>
                            )}
                        </div>
                    )}

                    {isResetting ? (
                        <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                            <div>
                                <label
                                    htmlFor="reset-email"
                                    className="mb-1 block text-sm font-semibold text-slate-700"
                                >
                                    Email address
                                </label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="reset-new-password"
                                    className="mb-1 block text-sm font-semibold text-slate-700"
                                >
                                    New password
                                </label>
                                <input
                                    id="reset-new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="reset-confirm-password"
                                    className="mb-1 block text-sm font-semibold text-slate-700"
                                >
                                    Confirm new password
                                </label>
                                <input
                                    id="reset-confirm-password"
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Updating password..." : "Update Password & Sign In →"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsResetting(false);
                                    setError("");
                                }}
                                className="w-full text-center text-sm font-semibold text-slate-600 hover:text-slate-900"
                            >
                                ← Back to sign in
                            </button>
                        </form>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="mt-8 space-y-5"
                        >
                            <div>
                                <label
                                    htmlFor="login-email"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Email address
                                </label>

                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label
                                        htmlFor="login-password"
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsResetting(true);
                                            setError("");
                                            setResetSuccess("");
                                        }}
                                        className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                <input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Signing in..." : "Sign in →"}
                            </button>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Don't have an account?{" "}
                        <button
                            type="button"
                            onClick={onRegisterClick}
                            className="font-bold text-blue-700 hover:text-blue-900"
                        >
                            Create an account
                        </button>
                    </p>

                    <p className="mt-6 text-center text-xs text-slate-400">
                        Secure sign-in · RailBite Passenger Portal
                    </p>
                </section>
            </div>
        </main>
    );
}

export default Login;
