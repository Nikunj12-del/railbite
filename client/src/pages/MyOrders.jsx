import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import OrderCard from "../components/OrderCard";
import { useSocket } from "../hooks/useSocket";

function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notification, setNotification] = useState(null);

    const { socket, connected } = useSocket();
    const notificationTimer = useRef(null);

    const fetchOrders = useCallback(async () => {
        try {
            setError("");

            const response = await api.get("/orders/my-orders");
            const data = response.data;

            const orderList = Array.isArray(data)
                ? data
                : data.orders || [];

            setOrders(orderList);
        } catch (err) {
            console.error("Fetch orders error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load your orders."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        if (!socket) return;

        const notifications = {
            ACCEPTED: {
                title: "Order Accepted! 🎉",
                message: "Pantry staff has accepted your order.",
            },
            PREPARING: {
                title: "Food Is Being Prepared! 👨‍🍳",
                message: "Your food is now being prepared.",
            },
            READY: {
                title: "Your Food Is Ready! 🍱",
                message: "Your order is ready for delivery.",
            },
            OUT_FOR_DELIVERY: {
                title: "On Its Way! 🚆",
                message: "Your food is on its way to your seat.",
            },
            DELIVERED: {
                title: "Order Delivered! ✅",
                message: "Enjoy your meal!",
            },
            CANCELLED: {
                title: "Order Cancelled",
                message: "Your order has been cancelled.",
            },
        };

        const handleOrderUpdated = (data) => {
            console.log(
                "Order update received:",
                JSON.stringify(data)
            );

            const updatedOrder = data?.order || data;
            const newStatus =
                updatedOrder?.status || data?.status;

            const message = notifications[newStatus];

            if (message) {
                setNotification({
                    ...message,
                    id: Date.now(),
                });

                if (notificationTimer.current) {
                    clearTimeout(notificationTimer.current);
                }

                notificationTimer.current = setTimeout(() => {
                    setNotification(null);
                    notificationTimer.current = null;
                }, 8000);
            }

            fetchOrders();
        };

        const handleConnect = () => {
            console.log("MyOrders socket connected:", socket.id);
            fetchOrders();
        };

        const handleConnectError = (err) => {
            console.error(
                "MyOrders socket connection error:",
                err.message
            );
        };

        socket.on("order-updated", handleOrderUpdated);
        socket.on("connect", handleConnect);
        socket.on("connect_error", handleConnectError);

        if (socket.connected) {
            fetchOrders();
        }

        return () => {
            socket.off("order-updated", handleOrderUpdated);
            socket.off("connect", handleConnect);
            socket.off("connect_error", handleConnectError);
        };
    }, [socket, fetchOrders]);

    useEffect(() => {
        return () => {
            if (notificationTimer.current) {
                clearTimeout(notificationTimer.current);
            }
        };
    }, []);

    const closeNotification = () => {
        if (notificationTimer.current) {
            clearTimeout(notificationTimer.current);
            notificationTimer.current = null;
        }

        setNotification(null);
    };

    const inProgressStatuses = [
        "PLACED",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY",
    ];

    const inProgressCount = orders.filter((order) =>
        inProgressStatuses.includes(order.status)
    ).length;

    const deliveredCount = orders.filter(
        (order) => order.status === "DELIVERED"
    ).length;

    return (
        <div className="space-y-6">
            {notification && (
                <div
                    key={notification.id}
                    role="status"
                    aria-live="polite"
                    className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl dark:border-emerald-900 dark:bg-slate-900 sm:right-6 sm:top-6"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl dark:bg-emerald-950">
                            🔔
                        </div>

                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">
                                {notification.title}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {notification.message}
                            </p>

                            <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                RailBite Order Update
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeNotification}
                            aria-label="Close notification"
                            className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                    Your journey
                </p>

                <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">
                    My Orders 📦
                </h1>

                <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Track your food orders and check their latest status.
                </p>

                <p
                    className={`mt-2 text-sm font-semibold ${
                        connected
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                    }`}
                >
                    {connected
                        ? "● Live tracking connected"
                        : "● Connecting to live tracking..."}
                </p>
            </div>

            {!loading && !error && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Total Orders
                        </p>

                        <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
                            {orders.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            In Progress
                        </p>

                        <p className="mt-2 text-2xl font-black text-blue-700 dark:text-blue-400">
                            {inProgressCount}
                        </p>
                    </div>

                    <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:col-span-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Delivered
                        </p>

                        <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {deliveredCount}
                        </p>
                    </div>
                </div>
            )}

            {loading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Loading your orders...
                    </p>
                </div>
            )}

            {!loading && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
                    <h2 className="font-bold text-red-700 dark:text-red-300">
                        Couldn't load orders
                    </h2>

                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={fetchOrders}
                        className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {!loading && !error && orders.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-5xl">🍱</div>

                    <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
                        No orders yet
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Your food orders will appear here once you order
                        something for your journey.
                    </p>

                    <Link
                        to="/menu"
                        className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800"
                    >
                        Explore Food Menu →
                    </Link>
                </div>
            )}

            {!loading && !error && orders.length > 0 && (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <OrderCard
                            key={order._id}
                            order={order}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyOrders;
