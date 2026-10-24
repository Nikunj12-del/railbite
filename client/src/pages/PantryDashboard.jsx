import { useCallback, useEffect, useMemo, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import api from "../services/api";

const STATUSES = [
    "ALL",
    "PLACED",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY"
];

const NEXT_STATUS = {
    PLACED: "ACCEPTED",
    ACCEPTED: "PREPARING",
    PREPARING: "READY",
    READY: "OUT_FOR_DELIVERY",
    OUT_FOR_DELIVERY: "DELIVERED"
};

const STATUS_STYLE = {
    PLACED: "bg-amber-100 text-amber-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-violet-100 text-violet-800",
    READY: "bg-emerald-100 text-emerald-800",
    OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
    DELIVERED: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-red-100 text-red-800"
};

function formatStatus(status = "") {
    return status.replaceAll("_", " ");
}

function formatMoney(amount = 0) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

function getCustomerName(order) {
    return order.user?.fullName || order.user?.name || "Passenger";
}

function getTrainName(order) {
    return order.train?.trainName || order.train?.trainNumber || "Train";
}

function getItems(order) {
    return (order.items || []).map((item) => ({
        name:
            item.foodItem?.name ||
            item.foodItem?.foodName ||
            item.name ||
            "Food item",
        quantity: Number(item.quantity) || 1
    }));
}

function getOrderTotal(order) {
    if (order.totalAmount != null) {
        return order.totalAmount;
    }

    if (order.totalPrice != null) {
        return order.totalPrice;
    }

    return (order.items || []).reduce((total, item) => {
        const price =
            Number(item.price ?? item.foodItem?.price) || 0;

        return total + price * (Number(item.quantity) || 1);
    }, 0);
}

function StatCard({ label, value, icon, detail, color }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                        {value}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        {detail}
                    </p>
                </div>

                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function PantryDashboard() {
    const { socket, connected } = useSocket();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [activeStatus, setActiveStatus] = useState("ALL");
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async (showLoader = false) => {
        if (showLoader) {
            setRefreshing(true);
        }

        try {
            const response = await api.get("/orders/pantry");
            const data = response.data;

            setOrders(
                Array.isArray(data)
                    ? data
                    : data.orders || []
            );

            setError("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load pantry orders."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        if (!socket) return;

        const handleNewOrder = () => {
            fetchOrders();
        };

        const handleOrderUpdate = () => {
            fetchOrders();
        };

        socket.on("new-order", handleNewOrder);
        socket.on("order-updated", handleOrderUpdate);

        return () => {
            socket.off("new-order", handleNewOrder);
            socket.off("order-updated", handleOrderUpdate);
        };
    }, [socket, fetchOrders]);

    const stats = useMemo(() => ({
        active: orders.filter(
            (order) =>
                !["DELIVERED", "CANCELLED"].includes(order.status)
        ).length,

        placed: orders.filter(
            (order) => order.status === "PLACED"
        ).length,

        preparing: orders.filter(
            (order) => order.status === "PREPARING"
        ).length,

        ready: orders.filter(
            (order) =>
                ["READY", "OUT_FOR_DELIVERY"].includes(order.status)
        ).length
    }), [orders]);

    const filteredOrders = useMemo(() => {
        const query = search.trim().toLowerCase();

        return orders
            .filter((order) => {
                if (
                    activeStatus !== "ALL" &&
                    order.status !== activeStatus
                ) {
                    return false;
                }

                if (!query) return true;

                const searchableText = [
                    order._id,
                    getCustomerName(order),
                    getTrainName(order),
                    order.train?.trainNumber,
                    order.coachNumber,
                    order.seatNumber,
                    ...getItems(order).map((item) => item.name)
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchableText.includes(query);
            })
            .sort(
                (a, b) =>
                    new Date(b.createdAt || 0) -
                    new Date(a.createdAt || 0)
            );
    }, [orders, search, activeStatus]);

    const updateStatus = async (order) => {
        const nextStatus = NEXT_STATUS[order.status];

        if (!nextStatus || updatingId) return;

        setUpdatingId(order._id);
        setError("");

        try {
            await api.patch(`/orders/${order._id}/status`, {
                status: nextStatus
            });

            await fetchOrders();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not update the order status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const cancelOrder = async (order) => {
        const allowedStatuses = [
            "PLACED",
            "ACCEPTED",
            "PREPARING"
        ];

        if (!allowedStatuses.includes(order.status)) return;

        const confirmed = window.confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmed || updatingId) return;

        setUpdatingId(order._id);
        setError("");

        try {
            await api.patch(`/orders/${order._id}/status`, {
                status: "CANCELLED"
            });

            await fetchOrders();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not cancel this order."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="min-h-screen space-y-7 pb-10">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-xl sm:p-9">
                <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
                <div className="absolute -bottom-24 right-1/3 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />

                <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                            <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-emerald-400" : "bg-amber-400"}`} />

                            {connected
                                ? "LIVE SYSTEM CONNECTED"
                                : "RECONNECTING TO LIVE SYSTEM"}
                        </div>

                        <p className="text-sm font-medium text-blue-200">
                            RAILBITE OPERATIONS
                        </p>

                        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                            Pantry Command Center
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80">
                            Manage incoming orders, prepare meals, and
                            keep every train journey running smoothly.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchOrders(true)}
                        disabled={refreshing}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold transition hover:bg-white/20 disabled:opacity-60"
                    >
                        <span className={refreshing ? "animate-spin" : ""}>
                            ↻
                        </span>

                        {refreshing ? "Refreshing..." : "Refresh orders"}
                    </button>
                </div>
            </section>

            {error && (
                <div
                    role="alert"
                    className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        className="font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}

            <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            Operations overview
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            A snapshot of your current order queue.
                        </p>
                    </div>

                    <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
                        Live statistics
                    </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Active orders"
                        value={stats.active}
                        icon="📋"
                        detail="Orders in progress"
                        color="bg-blue-50"
                    />

                    <StatCard
                        label="New orders"
                        value={stats.placed}
                        icon="🔔"
                        detail="Waiting for acceptance"
                        color="bg-amber-50"
                    />

                    <StatCard
                        label="Being prepared"
                        value={stats.preparing}
                        icon="👨‍🍳"
                        detail="Currently in the kitchen"
                        color="bg-violet-50"
                    />

                    <StatCard
                        label="Ready / delivery"
                        value={stats.ready}
                        icon="🚆"
                        detail="Ready or on the way"
                        color="bg-emerald-50"
                    />
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">
                                Order management
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Search, filter, and update orders.
                            </p>
                        </div>

                        <div className="relative w-full lg:max-w-sm">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                ⌕
                            </span>

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search passenger, train, seat..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                        {STATUSES.map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setActiveStatus(status)}
                                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                                    activeStatus === status
                                        ? "bg-slate-950 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {status === "ALL"
                                    ? "All orders"
                                    : formatStatus(status)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 bg-slate-50 px-5 py-3 sm:px-6">
                    <p className="text-sm font-semibold text-slate-600">
                        {filteredOrders.length} order
                        {filteredOrders.length !== 1 ? "s" : ""} found
                    </p>

                    <span className="text-xs text-slate-400">
                        Newest first
                    </span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

                        <p className="mt-4 text-sm font-medium text-slate-500">
                            Loading pantry orders...
                        </p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="px-6 py-20 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                            🍽️
                        </div>

                        <h3 className="mt-5 text-lg font-bold text-slate-900">
                            No orders found
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            {search || activeStatus !== "ALL"
                                ? "Try changing your search or status filter."
                                : "New passenger orders will appear here."}
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setActiveStatus("ALL");
                                fetchOrders(true);
                            }}
                            className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
                        {filteredOrders.map((order) => {
                            const nextStatus = NEXT_STATUS[order.status];
                            const isUpdating =
                                updatingId === order._id;

                            return (
                                <article
                                    key={order._id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-blue-200 hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                Order reference
                                            </p>

                                            <h3 className="mt-1 break-all font-mono text-sm font-bold text-slate-900">
                                                #{String(order._id).slice(-8).toUpperCase()}
                                            </h3>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
                                                STATUS_STYLE[order.status] ||
                                                "bg-slate-100 text-slate-700"
                                            }`}
                                        >
                                            {formatStatus(order.status)}
                                        </span>
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs text-slate-500">
                                                Train
                                            </p>

                                            <p className="mt-1 truncate text-sm font-bold text-slate-900">
                                                {getTrainName(order)}
                                            </p>

                                            {order.train?.trainNumber && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    No. {order.train.trainNumber}
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs text-slate-500">
                                                Delivery location
                                            </p>

                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                Coach {order.coachNumber || "—"}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Seat {order.seatNumber || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Passenger
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-slate-800">
                                            {getCustomerName(order)}
                                        </p>

                                        {order.user?.email && (
                                            <p className="mt-1 break-all text-xs text-slate-500">
                                                {order.user.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4 border-t border-dashed border-slate-200 pt-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Items ordered
                                        </p>

                                        <div className="mt-3 space-y-2">
                                            {getItems(order).map((item, index) => (
                                                <div
                                                    key={`${item.name}-${index}`}
                                                    className="flex items-center justify-between gap-3 text-sm"
                                                >
                                                    <span className="text-slate-700">
                                                        {item.name}
                                                    </span>

                                                    <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                                        × {item.quantity}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {order.specialInstructions && (
                                            <div className="mt-3 rounded-xl bg-amber-50 p-3">
                                                <p className="text-xs font-bold text-amber-800">
                                                    Special instructions
                                                </p>

                                                <p className="mt-1 text-sm text-amber-900">
                                                    {order.specialInstructions}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Order total
                                            </p>

                                            <p className="mt-1 text-xl font-black text-slate-900">
                                                {formatMoney(getOrderTotal(order))}
                                            </p>

                                            {order.createdAt && (
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {new Date(order.createdAt).toLocaleString("en-IN", {
                                                        dateStyle: "medium",
                                                        timeStyle: "short"
                                                    })}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {nextStatus && (
                                                <button
                                                    type="button"
                                                    disabled={isUpdating || Boolean(updatingId)}
                                                    onClick={() => updateStatus(order)}
                                                    className="rounded-xl bg-blue-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isUpdating
                                                        ? "Updating..."
                                                        : `Mark ${formatStatus(nextStatus)} →`}
                                                </button>
                                            )}

                                            {[
                                                "PLACED",
                                                "ACCEPTED",
                                                "PREPARING"
                                            ].includes(order.status) && (
                                                <button
                                                    type="button"
                                                    disabled={isUpdating || Boolean(updatingId)}
                                                    onClick={() => cancelOrder(order)}
                                                    className="rounded-xl border border-red-200 px-3 py-3 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center">
                <p>RailBite Operations · Pantry Management</p>

                <p>
                    {connected
                        ? "Live updates enabled"
                        : "Live updates reconnecting"}
                    {" · "}Refresh available anytime
                </p>
            </footer>
        </div>
    );
}

export default PantryDashboard;
