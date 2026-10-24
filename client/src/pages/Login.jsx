
import { useState } from "react";
import api from "../services/api";
import { useSocket } from "../hooks/useSocket";

function Login({
    onLogin,
    onRegisterClick,
    initialEmail = ""
}) {
    const [email, setEmail] = useState(
        initialEmail || "passenger.test@example.com"
    );
    const [password, setPassword] = useState("test123456");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { reconnectSocket } = useSocket();

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError("");

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
                    <h2 className="text-3xl font-black text-slate-900">
                        Welcome aboard!
                    </h2>

                    <p className="mt-2 text-slate-500">
                        Sign in to your passenger account.
                    </p>

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
                            <label
                                htmlFor="login-password"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Password
                            </label>

                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Enter password"
                                autoComplete="current-password"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Sign in →"}
                        </button>
                    </form>

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
