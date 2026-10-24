import { useState } from "react";
import api from "../services/api";

function Register({ onBackToLogin, onRegistered }) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/register", {
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                password
            });

            setSuccess(
                response.data.message || "Registration successful!"
            );

            if (onRegistered) {
                onRegistered(email.trim().toLowerCase());
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
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
                            <span className="text-2xl font-black">RailBite</span>
                        </div>

                        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-200">
                            Your journey starts here
                        </p>

                        <h1 className="text-4xl font-black leading-tight">
                            Good food makes every journey better.
                        </h1>

                        <p className="mt-5 leading-7 text-blue-100">
                            Create your passenger account and order delicious
                            meals delivered right to your train seat.
                        </p>
                    </div>

                    <p className="mt-10 text-sm text-blue-200">
                        Your journey. Your food. Your comfort.
                    </p>
                </section>

                <section className="p-8 sm:p-12">
                    <h2 className="text-3xl font-black text-slate-900">
                        Create account
                    </h2>

                    <p className="mt-2 text-slate-500">
                        Join RailBite and make your journey tastier.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Full name
                            </label>

                            <input
                                type="text"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                placeholder="Enter your full name"
                                autoComplete="name"
                                maxLength={100}
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Email address
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
                                minLength={6}
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Confirm password
                            </label>

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Enter password again"
                                autoComplete="new-password"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </p>
                        )}

                        {success && (
                            <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                                {success}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Creating account..." : "Create account →"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={onBackToLogin}
                            className="font-bold text-blue-700 hover:text-blue-900"
                        >
                            Sign in
                        </button>
                    </p>

                    <p className="mt-4 text-center text-xs text-slate-400">
                        Secure registration · RailBite Passenger Portal
                    </p>
                </section>
            </div>
        </main>
    );
}

export default Register;