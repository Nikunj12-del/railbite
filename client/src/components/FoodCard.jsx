import { useState } from "react";

function FoodCard({ item, quantity = 0, onAdd, onRemove }) {
    const [imageError, setImageError] = useState(false);

    const name = item?.name || "Food Item";
    const price = Number(item?.price) || 0;
    const description =
        item?.description || "Freshly prepared for your journey.";

    const available =
        item?.isAvailable !== false &&
        item?.available !== false &&
        item?.availability !== false;

    const stock = Number(item?.stock);
    const outOfStock =
        !available ||
        (Number.isFinite(stock) && stock <= 0);

    const image = item?.image || item?.imageUrl;

    return (
        <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
            <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700">
                {image && !imageError ? (
                    <img
                        src={image}
                        alt={name}
                        onError={() => setImageError(true)}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <span
                        className="text-7xl"
                        role="img"
                        aria-label={name}
                    >
                        🍱
                    </span>
                )}

                <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
                        outOfStock
                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                >
                    {outOfStock ? "Out of Stock" : "Available"}
                </span>
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {name}
                    </h2>

                    <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        ₹{price}
                    </span>
                </div>

                <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {description}
                </p>

                <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {item?.category || "Food"}
                </p>

                {outOfStock ? (
                    <button
                        type="button"
                        disabled
                        className="mt-5 w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    >
                        Currently Unavailable
                    </button>
                ) : quantity === 0 ? (
                    <button
                        type="button"
                        onClick={() => onAdd?.(item)}
                        className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800 active:scale-[0.98]"
                    >
                        + Add to Cart
                    </button>
                ) : (
                    <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-2 dark:border-blue-900 dark:bg-blue-950/50">
                        <button
                            type="button"
                            onClick={() => onRemove?.(item)}
                            aria-label={`Remove one ${name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xl font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                        >
                            −
                        </button>

                        <div className="text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Quantity
                            </p>
                            <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                                {quantity}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onAdd?.(item)}
                            disabled={
                                Number.isFinite(stock) && quantity >= stock
                            }
                            aria-label={`Add one ${name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-xl font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            +
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}

export default FoodCard;
