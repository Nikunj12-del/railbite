import { useEffect, useState } from "react";
import api from "../services/api";
import StatusBadge from "./StatusBadge";

function OrderCard({ order }) {
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState(order?.status);

    const items = order?.items || [];

    useEffect(() => {
        setStatus(order?.status);
    }, [order?.status]);

    const orderTotal =
        order?.totalAmount ??
        order?.totalPrice ??
        order?.total ??
        0;

    const orderDate = order?.createdAt
        ? new Date(order.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short"
          })
        : "Date unavailable";

    const handleCancelOrder = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmed || cancelling) return;

        setCancelling(true);
        setError("");

        try {
            const response = await api.patch(
                `/orders/${order._id}/cancel`
            );

            const updatedOrder =
                response.data.order || response.data;

            setStatus(updatedOrder.status || "CANCELLED");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to cancel this order. Please try again."
            );
        } finally {
            setCancelling(false);
        }
    };

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Order ID
                    </p>

                    <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">
                        #{String(order?._id || "").slice(-8).toUpperCase()}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {orderDate}
                    </p>
                </div>

                <StatusBadge status={status} />
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">
                <div>
                    <h3 className="mb-3 font-bold text-slate-800 dark:text-slate-200">
                        🍱 Ordered Items
                    </h3>

                    {items.length > 0 ? (
                        <div className="space-y-3">
                            {items.map((item, index) => {
                                const food =
                                    item.foodItem || item.food || {};

                                const name =
                                    food.name ||
                                    item.name ||
                                    "Food item";

                                const quantity = item.quantity || 1;
                                const price = item.price ?? food.price ?? 0;

                                return (
                                    <div
                                        key={item._id || `${name}-${index}`}
                                        className="flex items-start justify-between gap-3"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                {name}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                                ₹{price} × {quantity}
                                            </p>
                                        </div>

                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            ₹{price * quantity}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Item details unavailable.
                        </p>
                    )}
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">
                        🚆 Delivery Details
                    </h3>

                    <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-3">
                            <span className="text-slate-500 dark:text-slate-400">
                                Train
                            </span>

                            <span className="text-right font-semibold text-slate-800 dark:text-slate-200">
                                {order?.train?.trainName ||
                                    order?.train?.name ||
                                    order?.train?.trainNumber ||
                                    "Train details unavailable"}
                            </span>
                        </div>

                        <div className="flex justify-between gap-3">
                            <span className="text-slate-500 dark:text-slate-400">
                                Coach
                            </span>

                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {order?.coachNumber || "—"}
                            </span>
                        </div>

                        <div className="flex justify-between gap-3">
                            <span className="text-slate-500 dark:text-slate-400">
                                Seat
                            </span>

                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {order?.seatNumber || "—"}
                            </span>
                        </div>
                    </div>

                    {order?.specialInstructions && (
                        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                SPECIAL INSTRUCTIONS
                            </p>

                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                {order.specialInstructions}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                >
                    {error}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <div>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Order Total
                    </span>

                    <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                        ₹{orderTotal}
                    </p>
                </div>

                {status === "PLACED" && (
                    <button
                        type="button"
                        onClick={handleCancelOrder}
                        disabled={cancelling}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                        {cancelling
                            ? "Cancelling..."
                            : "Cancel Order"}
                    </button>
                )}
            </div>
        </article>
    );
}

export default OrderCard;
