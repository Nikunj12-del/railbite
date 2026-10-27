import { Link } from "react-router-dom";

function Dashboard({ user }) {
    const userName =
        user?.fullName ||
        user?.name ||
        user?.email?.split("@")[0] ||
        "Passenger";

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white shadow-lg sm:p-10">
                <p className="text-sm font-semibold text-blue-100">
                    WELCOME ABOARD
                </p>

                <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                    Hello, {userName}! 👋
                </h1>

                <p className="mt-3 max-w-xl leading-7 text-blue-100">
                    Hungry during your journey? Explore the menu and get
                    delicious food delivered right to your train seat.
                </p>
            </section>

            <section>
                <div className="mb-5">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        Your Journey, Made Better
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Everything you need for a comfortable food-ordering
                        experience.
                    </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                            🍽️
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                            Explore Food Menu
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Discover meals, snacks and beverages available
                            during your train journey.
                        </p>

                        <Link
                            to="/menu"
                            className="mt-5 inline-flex rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                        >
                            Explore Menu →
                        </Link>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                            📦
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                            Track Your Orders
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Check your order status and follow its progress
                            from preparation to delivery.
                        </p>

                        <Link
                            to="/orders"
                            className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            My Orders →
                        </Link>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
                            📋
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                            Pantry Workspace
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Test live order status updates (Ready, Preparing, etc.) and watch real-time socket events.
                        </p>

                        <Link
                            to="/pantry"
                            className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                        >
                            Open Pantry →
                        </Link>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950">
                <p className="font-bold text-blue-900 dark:text-blue-200">
                    💡 Your food, your seat, your comfort.
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800 dark:text-blue-300">
                    Place your order and let RailBite make your journey
                    more enjoyable.
                </p>
            </section>
        </div>
    );
}

export default Dashboard;
