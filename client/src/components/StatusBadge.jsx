function StatusBadge({ status }) {
    const statusStyles = {
        PLACED: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
        ACCEPTED: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
        PREPARING: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800",
        READY: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
        OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800",
        DELIVERED: "bg-green-100 text-green-700 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800",
        CANCELLED: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800"
    };

    const statusLabels = {
        PLACED: "Order Placed",
        ACCEPTED: "Accepted",
        PREPARING: "Preparing",
        READY: "Ready",
        OUT_FOR_DELIVERY: "Out for Delivery",
        DELIVERED: "Delivered",
        CANCELLED: "Cancelled"
    };

    const normalizedStatus = String(status || "")
        .trim()
        .toUpperCase();

    const badgeStyle =
        statusStyles[normalizedStatus] ||
        "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700";

    const label =
        statusLabels[normalizedStatus] ||
        normalizedStatus.replaceAll("_", " ") ||
        "Unknown";

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${badgeStyle}`}
        >
            <span
                className="h-1.5 w-1.5 rounded-full bg-current"
                aria-hidden="true"
            />

            {label}
        </span>
    );
}

export default StatusBadge;
