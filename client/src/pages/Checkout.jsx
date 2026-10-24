
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../services/api";

function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);

        document.body.appendChild(script);
    });
}

function Checkout() {
    const navigate = useNavigate();
    const { cart, cartTotal, clearCart } = useCart();

    const [trains, setTrains] = useState([]);
    const [trainsLoading, setTrainsLoading] = useState(true);
    const [trainError, setTrainError] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        trainId: "",
        coachNumber: "",
        seatNumber: "",
        specialInstructions: ""
    });

    useEffect(() => {
        let isMounted = true;

        async function fetchTrains() {
            try {
                const response = await api.get("/trains");
                const data = response.data;

                if (isMounted) {
                    setTrains(
                        Array.isArray(data)
                            ? data
                            : Array.isArray(data?.trains)
                                ? data.trains
                                : []
                    );
                }
            } catch (err) {
                if (isMounted) {
                    setTrainError(
                        err.response?.data?.message ||
                        "Unable to load trains. Please try again."
                    );
                }
            } finally {
                if (isMounted) {
                    setTrainsLoading(false);
                }
            }
        }

        fetchTrains();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (cart.length === 0) {
            setError("Your cart is empty.");
            return;
        }

        if (!trains.some((train) => train._id === formData.trainId)) {
            setError("Please select a valid train.");
            return;
        }

        setLoading(true);
        setError("");

        let orderId;

        try {
            // Step 1: Create the unpaid order on the backend.
            const orderResponse = await api.post("/orders", {
                trainId: formData.trainId,
                coachNumber: formData.coachNumber.trim(),
                seatNumber: formData.seatNumber.trim(),
                specialInstructions:
                    formData.specialInstructions.trim(),
                items: cart.map((item) => ({
                    foodItem: item._id,
                    quantity: item.quantity
                }))
            });

            orderId = orderResponse.data?.order?._id;

            if (!orderId) {
                throw new Error("Order was created, but its ID was not returned.");
            }

            // Step 2: Ask the backend to create a Razorpay payment order.
            const paymentResponse = await api.post(
                `/orders/${orderId}/create-payment`
            );

            const paymentData = paymentResponse.data;

            // Step 3: Load Razorpay Checkout.
            const scriptLoaded = await loadRazorpayScript();

            if (!scriptLoaded) {
                throw new Error(
                    `Order ${orderId} was created, but payment could not be opened. Retry checkout.`
                );
            }

            // Step 4: Open the payment popup.
            await new Promise((resolve, reject) => {
                let paymentFinished = false;

                const options = {
                    key: paymentData.key,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    name: "RailBite",
                    description: "Train food order",
                    order_id: paymentData.orderId,

                    handler: async (response) => {
                        if (paymentFinished) return;
                        paymentFinished = true;

                        try {
                            // Step 5: Verify payment on the server.
                            const verificationResponse = await api.post(
                                `/orders/${orderId}/verify-payment`,
                                {
                                    razorpay_order_id:
                                        response.razorpay_order_id,
                                    razorpay_payment_id:
                                        response.razorpay_payment_id,
                                    razorpay_signature:
                                        response.razorpay_signature
                                }
                            );

                            if (
                                verificationResponse.data?.order
                                    ?.paymentStatus !== "PAID"
                            ) {
                                throw new Error(
                                    "Payment could not be confirmed. Check your orders before retrying."
                                );
                            }

                            resolve(verificationResponse.data);
                        } catch (err) {
                            reject(
                                new Error(
                                    err.response?.data?.message ||
                                    "Payment verification failed. Check your orders before retrying."
                                )
                            );
                        }
                    },

                    modal: {
                        ondismiss: () => {
                            if (paymentFinished) return;
                            paymentFinished = true;

                            reject(
                                new Error(
                                    `Payment window closed. Your order ID is ${orderId}. Check your orders before retrying.`
                                )
                            );
                        }
                    },

                    theme: {
                        color: "#1D4ED8"
                    }
                };

                const razorpay = new window.Razorpay(options);

                razorpay.on("payment.failed", (response) => {
                    if (paymentFinished) return;
                    paymentFinished = true;

                    reject(
                        new Error(
                            response.error?.description ||
                            `Payment failed. Your order ID is ${orderId}.`
                        )
                    );
                });

                razorpay.open();
            });

            // Step 6: Clear the cart only after server verification.
            clearCart();

            navigate("/orders", {
                replace: true,
                state: {
                    orderPlaced: true,
                    message: "Payment successful! Your order is confirmed."
                }
            });
        } catch (err) {
            setError(
                err.message ||
                err.response?.data?.message ||
                "Checkout failed. Check your orders before retrying."
            );
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900";

    const labelClass =
        "mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300";

    if (cart.length === 0) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-5xl">🛒</p>

                <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-slate-100">
                    Your cart is empty
                </h1>

                <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Add food items before proceeding to checkout.
                </p>

                <Link
                    to="/menu"
                    className="mt-6 inline-block rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800"
                >
                    Browse Menu
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                    Almost there
                </p>

                <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">
                    Checkout 🚆
                </h1>

                <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Select your train and enter your seat details.
                </p>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-5">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3"
                >
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                        Journey Details
                    </h2>

                    <div>
                        <label htmlFor="trainId" className={labelClass}>
                            Select Train
                        </label>

                        <select
                            id="trainId"
                            name="trainId"
                            value={formData.trainId}
                            onChange={handleChange}
                            required
                            disabled={trainsLoading || trains.length === 0}
                            className={`${inputClass} disabled:bg-slate-100 dark:disabled:bg-slate-800`}
                        >
                            <option value="">
                                {trainsLoading
                                    ? "Loading trains..."
                                    : "Choose your train"}
                            </option>

                            {trains.map((train) => (
                                <option key={train._id} value={train._id}>
                                    {train.trainNumber} - {train.trainName}
                                </option>
                            ))}
                        </select>

                        {trainError && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {trainError}
                            </p>
                        )}

                        {!trainsLoading &&
                            !trainError &&
                            trains.length === 0 && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    No trains are available.
                                </p>
                            )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="coachNumber" className={labelClass}>
                                Coach Number
                            </label>

                            <input
                                id="coachNumber"
                                name="coachNumber"
                                value={formData.coachNumber}
                                onChange={handleChange}
                                required
                                placeholder="e.g. C1"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label htmlFor="seatNumber" className={labelClass}>
                                Seat Number
                            </label>

                            <input
                                id="seatNumber"
                                name="seatNumber"
                                type="number"
                                min="1"
                                value={formData.seatNumber}
                                onChange={handleChange}
                                required
                                placeholder="e.g. 10"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="specialInstructions"
                            className={labelClass}
                        >
                            Special Instructions (Optional)
                        </label>

                        <textarea
                            id="specialInstructions"
                            name="specialInstructions"
                            value={formData.specialInstructions}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Any delivery instructions..."
                            className={`${inputClass} resize-y`}
                        />
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            trainsLoading ||
                            trains.length === 0
                        }
                        className="w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading
                            ? "Processing Payment..."
                            : `Pay ₹${cartTotal} with Razorpay`}
                    </button>

                    <Link
                        to="/cart"
                        className="block text-center text-sm font-semibold text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400"
                    >
                        ← Back to Cart
                    </Link>
                </form>

                <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                        Order Summary
                    </h2>

                    <div className="mt-5 space-y-4">
                        {cart.map((item) => (
                            <div
                                key={item._id}
                                className="flex justify-between gap-4 text-sm"
                            >
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                        {item.name}
                                    </p>

                                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                                        Qty: {item.quantity}
                                    </p>
                                </div>

                                <p className="shrink-0 font-bold text-slate-900 dark:text-slate-100">
                                    ₹{Number(item.price) * item.quantity}
                                </p>
                            </div>
                        ))}
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

                    <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Your order will be sent to the pantry after
                        payment is successfully verified.
                    </p>
                </aside>
            </div>
        </div>
    );
}

export default Checkout;
