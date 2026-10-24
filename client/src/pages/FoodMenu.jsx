import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import FoodCard from "../components/FoodCard";
import { useCart } from "../context/CartContext";

function FoodMenu() {
    const [foodItems, setFoodItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const {
        cart,
        addToCart,
        removeFromCart,
        cartItemCount,
        cartTotal
    } = useCart();

    useEffect(() => {
        let isMounted = true;

        async function fetchFoodItems() {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/food");
                const data = response.data;

                const items = Array.isArray(data)
                    ? data
                    : data.foodItems || data.items || [];

                if (isMounted) {
                    setFoodItems(items);
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load the food menu."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchFoodItems();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="space-y-6 pb-24">
            <div>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                    Fresh from the pantry
                </p>

                <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                    Food Menu 🍽️
                </h1>

                <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Choose your favourite food for the journey.
                </p>
            </div>

            {loading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                        Loading food menu...
                    </p>
                </div>
            )}

            {!loading && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
                    <p className="font-bold text-red-700 dark:text-red-300">
                        Could not load the menu
                    </p>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                </div>
            )}

            {!loading && !error && foodItems.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-4xl">🥗</p>

                    <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                        No food items available
                    </h2>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Please check back later.
                    </p>
                </div>
            )}

            {!loading && !error && foodItems.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {foodItems.map((item) => {
                        const cartItem = cart.find(
                            (entry) => entry._id === item._id
                        );

                        return (
                            <FoodCard
                                key={item._id}
                                item={item}
                                quantity={cartItem?.quantity || 0}
                                onAdd={addToCart}
                                onRemove={() => removeFromCart(item._id)}
                            />
                        );
                    })}
                </div>
            )}

            {cartItemCount > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-20 mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl bg-slate-950 p-4 text-white shadow-2xl sm:bottom-6">
                    <div>
                        <p className="text-sm text-slate-300">
                            {cartItemCount} item(s) in cart
                        </p>

                        <p className="mt-1 text-xl font-black">
                            ₹{cartTotal}
                        </p>
                    </div>

                    <Link
                        to="/cart"
                        className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold transition hover:bg-blue-500"
                    >
                        View Cart →
                    </Link>
                </div>
            )}
        </div>
    );
}

export default FoodMenu;
