import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
    const {
        cart,
        addToCart,
        removeFromCart,
        deleteFromCart,
        cartItemCount,
        cartTotal
    } = useCart();

    if (cart.length === 0) {
        return (
            <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="text-7xl">🛒</div>

                <h1 className="mt-5 text-3xl font-black text-slate-900 dark:text-slate-100">
                    Your cart is empty
                </h1>

                <p className="mt-3 text-slate-500 dark:text-slate-400">
                    Add some delicious food for your train journey.
                </p>

                <Link
                    to="/menu"
                    className="mt-7 inline-flex rounded-xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800"
                >
                    Explore Food Menu →
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                    Your selection
                </p>

                <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">
                    Your Cart 🛒
                </h1>

                <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Review your items before placing your order.
                </p>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    {cart.map((item) => (
                        <div
                            key={item._id}
                            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center"
                        >
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 dark:bg-slate-800">
                                {item.image || item.imageUrl ? (
                                    <img
                                        src={item.image || item.imageUrl}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl">🍱</span>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {item.name}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    ₹{Number(item.price)} per item
                                </p>

                                <p className="mt-2 font-bold text-blue-700 dark:text-blue-400">
                                    ₹{Number(item.price) * item.quantity}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-1 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item._id)}
                                        aria-label={`Decrease ${item.name} quantity`}
                                        className="h-9 w-9 rounded-lg font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        −
                                    </button>

                                    <span className="min-w-5 text-center font-bold text-slate-900 dark:text-slate-100">
                                        {item.quantity}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => addToCart(item)}
                                        aria-label={`Increase ${item.name} quantity`}
                                        disabled={
                                            Number.isFinite(Number(item.stock)) &&
                                            item.stock !== undefined &&
                                            item.quantity >= Number(item.stock)
                                        }
                                        className="h-9 w-9 rounded-lg bg-blue-700 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => deleteFromCart(item._id)}
                                    className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}

                    <Link
                        to="/menu"
                        className="inline-flex font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        ← Continue Shopping
                    </Link>
                </div>

                <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24">
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                        Order Summary
                    </h2>

                    <div className="mt-5 flex justify-between text-sm text-slate-600 dark:text-slate-300">
                        <span>Total items</span>
                        <span>{cartItemCount}</span>
                    </div>

                    <div className="mt-4 flex justify-between text-sm text-slate-600 dark:text-slate-300">
                        <span>Food subtotal</span>
                        <span>₹{cartTotal}</span>
                    </div>

                    <div className="my-5 border-t border-slate-200 dark:border-slate-700" />

                    <div className="flex justify-between gap-3">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                            Total
                        </span>

                        <span className="text-2xl font-black text-blue-700 dark:text-blue-400">
                            ₹{cartTotal}
                        </span>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Final availability and order acceptance are subject to pantry confirmation.
                    </p>

                    <Link
                        to="/checkout"
                        className="mt-6 block w-full rounded-xl bg-blue-700 px-5 py-3 text-center font-bold text-white transition hover:bg-blue-800"
                    >
                        Proceed to Checkout →
                    </Link>
                </aside>
            </div>
        </div>
    );
}

export default Cart;
