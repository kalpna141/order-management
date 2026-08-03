import { useState } from "react";
import { CartProvider, useCart } from "./context/CartContext";
import MenuList from "./components/MenuList";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import OrderTracker from "./components/OrderTracker";
import OrderHistory, { savePhone } from "./components/OrderHistory";
import "./styles.css";

function AppShell() {
  const [view, setView] = useState("menu");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const { totalItems } = useCart();

  function handleOrderPlaced(order) {
    savePhone(order.customer.phone);
    setActiveOrderId(order.id);
    setView("tracking");
  }

  function handleStartNewOrder() {
    setActiveOrderId(null);
    setView("menu");
  }

  function handleTrackFromHistory(orderId) {
    setActiveOrderId(orderId);
    setView("tracking");
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>🍔 Bite Express</h1>
        <div className="app__header-right">
          {view === "menu" && (
            <span className="app__cart-indicator">
              {totalItems} item{totalItems === 1 ? "" : "s"} in cart
            </span>
          )}
          {view !== "history" && (
            <button
              type="button"
              className="btn btn--link"
              onClick={() => setView("history")}
            >
              My Orders
            </button>
          )}
        </div>
      </header>

      <main className="app__main">
        {view === "menu" && (
          <div className="app__layout">
            <MenuList />
            <Cart onCheckout={() => setView("checkout")} />
          </div>
        )}

        {view === "checkout" && (
          <Checkout
            onOrderPlaced={handleOrderPlaced}
            onBack={() => setView("menu")}
          />
        )}

        {view === "tracking" && activeOrderId && (
          <OrderTracker
            orderId={activeOrderId}
            onStartNewOrder={handleStartNewOrder}
          />
        )}

        {view === "history" && (
          <OrderHistory
            onTrackOrder={handleTrackFromHistory}
            onBack={() => setView("menu")}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppShell />
    </CartProvider>
  );
}
