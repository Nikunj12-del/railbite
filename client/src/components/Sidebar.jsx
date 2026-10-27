import { NavLink } from "react-router-dom";

function Sidebar({ user, onNavigate }) {
    const isPantryStaff = user?.role === "pantry_staff";

    const navigationItems = isPantryStaff
        ? [
              {
                  label: "Pantry Dashboard",
                  path: "/",
                  icon: "📋",
                  description: "Manage incoming orders"
              }
          ]
        : [
              {
                  label: "Dashboard",
                  path: "/",
                  icon: "🏠",
                  description: "Your journey overview"
              },
              {
                  label: "Food Menu",
                  path: "/menu",
                  icon: "🍽️",
                  description: "Explore available food"
              },
              {
                  label: "My Orders",
                  path: "/orders",
                  icon: "📦",
                  description: "Track your orders"
              },
              {
                  label: "Pantry Workspace",
                  path: "/pantry",
                  icon: "📋",
                  description: "Manage orders (Live Test)"
              }
          ];

    return (
        <div className="flex h-full flex-col border-r border-slate-200 bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-slate-100 px-5 py-6 dark:border-slate-800">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Main Menu
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-800 dark:text-white">
                    {isPantryStaff ? "Pantry Workspace" : "Passenger Portal"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {isPantryStaff
                        ? "Manage and deliver orders."
                        : "Everything for your journey."}
                </p>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                {navigationItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition duration-200 ${
                                isActive
                                    ? "bg-blue-700 text-white shadow-lg shadow-blue-700/20"
                                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl">
                                    {item.icon}
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-bold">
                                        {item.label}
                                    </span>

                                    <span
                                        className={`mt-1 block text-xs ${
                                            isActive
                                                ? "text-blue-100"
                                                : "text-slate-400"
                                        }`}
                                    >
                                        {item.description}
                                    </span>
                                </span>

                                <span className="text-lg" aria-hidden="true">
                                    ›
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="border-t border-slate-100 p-5 dark:border-slate-800">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🚆</span>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                            RailBite
                        </p>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Good food, delivered to your seat.
                    </p>

                    <p className="mt-3 text-xs font-semibold text-blue-700 dark:text-blue-400">
                        Made for your journey ❤️
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;
