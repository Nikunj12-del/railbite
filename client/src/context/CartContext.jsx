import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

const CartContext = createContext(null);

function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem("railbite-cart");
            return savedCart ? JSON.parse(savedCart) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem("railbite-cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item) => {
        const stock = Number(item.stock);

        setCart((previousCart) => {
            const existingItem = previousCart.find(
                (cartItem) => cartItem._id === item._id
            );

            if (
                Number.isFinite(stock) &&
                stock >= 0 &&
                (existingItem?.quantity || 0) >= stock
            ) {
                return previousCart;
            }

            if (existingItem) {
                return previousCart.map((cartItem) =>
                    cartItem._id === item._id
                        ? {
                              ...cartItem,
                              quantity: cartItem.quantity + 1
                          }
                        : cartItem
                );
            }

            return [...previousCart, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart((previousCart) =>
            previousCart
                .map((item) =>
                    item._id === itemId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const deleteFromCart = (itemId) => {
        setCart((previousCart) =>
            previousCart.filter((item) => item._id !== itemId)
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartItemCount = useMemo(
        () => cart.reduce((total, item) => total + item.quantity, 0),
        [cart]
    );

    const cartTotal = useMemo(
        () =>
            cart.reduce(
                (total, item) =>
                    total + Number(item.price || 0) * item.quantity,
                0
            ),
        [cart]
    );

    const value = {
        cart,
        addToCart,
        removeFromCart,
        deleteFromCart,
        clearCart,
        cartItemCount,
        cartTotal
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart must be used inside CartProvider");
    }

    return context;
}

export { CartProvider, useCart };


