import { useEffect, useState } from "react";
import { CartProvider, useCart } from "./context/CartContext";
import MenuList from "./components/MenuList";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import OrderTracker from "./components/OrderTracker";
import OrderHistory, { savePhone } from "./components/OrderHistory";
import "./styles.css";
import { searchAddresses } from "./utils/geoapify";

const DELIVERY_ADDRESS_KEY = "bite-express:selected-delivery-address";

function getSelectedDeliveryAddress() {
  try { return localStorage.getItem(DELIVERY_ADDRESS_KEY) || "Add delivery address"; }
  catch { return "Add delivery address"; }
}

function AppShell() {
  const [view, setView] = useState("menu");
  const [searchQuery, setSearchQuery] = useState("");
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(getSelectedDeliveryAddress);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const { totalItems } = useCart();
  useEffect(() => {
    const query = addressQuery.trim();
    if (query.length < 2) { setAddressSuggestions([]); setAddressError(""); return undefined; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setAddressLoading(true);
      setAddressError("");
      try {
        setAddressSuggestions(await searchAddresses(query, controller.signal));
      } catch (error) {
        if (error.name === 'AbortError') return;
        setAddressSuggestions([]);
        setAddressError(error.message);
      } finally { setAddressLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [addressQuery]);

  useEffect(() => {
    const clearMenuSearch = () => setSearchQuery("");
    window.addEventListener("clear-menu-search", clearMenuSearch);
    return () => window.removeEventListener("clear-menu-search", clearMenuSearch);
  }, []);

  useEffect(() => {
    if (deliveryAddress === "Add delivery address") return;
    try { localStorage.setItem(DELIVERY_ADDRESS_KEY, deliveryAddress); } catch { /* Storage may be unavailable. */ }
  }, [deliveryAddress]);

  function handleOrderPlaced(order) {
    savePhone(order.customer.phone);
    setActiveOrderId(order.id);
    setView("tracking");
    setConfirmedOrder(order);
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
      <div className="announcement announcement--address"><button type="button" onClick={() => setAddressOpen((open) => !open)}><span>⌖</span><b>{deliveryAddress}</b><i>⌄</i></button></div>
      {addressOpen && <div className="address-popover"><div className="address-popover__title"><div><strong>Choose delivery location</strong><span>Search any area, street, or landmark</span></div><button type="button" aria-label="Close address search" onClick={() => setAddressOpen(false)}>×</button></div><input autoFocus value={addressQuery} onChange={(event) => setAddressQuery(event.target.value)} placeholder="Start typing an address" /><div className="address-suggestions">{addressLoading ? <p>Searching addresses…</p> : addressError ? <p>{addressError}</p> : addressSuggestions.length ? addressSuggestions.map((address) => <button type="button" key={address.id} onClick={() => { setDeliveryAddress(address.label); setAddressOpen(false); setAddressQuery(""); setAddressSuggestions([]); }}><span>⌖</span><div><strong>{address.title}</strong><small>{address.label}</small></div></button>) : <p>{addressQuery.trim().length < 2 ? 'Type at least 2 characters to search.' : 'No matching addresses found.'}</p>}</div><div className="google-attribution">Powered by Geoapify</div></div>}
      <header className="app__header app__header--new">
        <div className="app__header-side app__header-side--left">
          <button type="button" className="brand" onClick={() => setView("menu")} aria-label="Bite Express home"><span>BITE</span><i>EXPRESS</i></button>
        </div>
        <div className="header-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg><input aria-label="Search menu" value={searchQuery} onFocus={() => setView("menu")} onChange={(event) => { setView("menu"); setSearchQuery(event.target.value); }} placeholder="What are you craving?" />{searchQuery && <button type="button" aria-label="Clear menu search" onClick={() => setSearchQuery("")}>×</button>}</div>
        <div className="app__header-side app__header-side--right">
          <button type="button" className="cart-trigger" aria-label={`Cart with ${totalItems} items`} onClick={() => setCartOpen(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2 11h10l2-7H6"/><circle cx="9" cy="19" r="1.2"/><circle cx="17" cy="19" r="1.2"/></svg><span className="header-action__count">{totalItems}</span></button>
        </div>
        <div className="app__header-legacy">
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
        </div></div>
      </header>

      <Cart coupon={coupon} setCoupon={setCoupon} isOpen={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setView("checkout"); }} />

      <main className={`app__main ${searchQuery ? 'app__main--searching' : ''}`}>
        {view === "menu" && (
          <><section className="menu-intro"><div className="menu-intro__content"><p className="eyebrow">Made fresh. Made for you.</p><h1>Cravings,<br/><em>delivered.</em></h1><p>Big flavor, quality ingredients, and your favorites delivered fresh to your door.</p><div className="menu-intro__actions"><button type="button" className="hero-primary" onClick={() => document.querySelector('.category-tabs')?.scrollIntoView({ behavior: 'smooth' })}>Explore the menu <span>↓</span></button><button type="button" className="orders-link" onClick={() => setView("history")}>View my orders <span>→</span></button></div><div className="menu-intro__proof"><span><b>30 min</b> average delivery</span><i></i><span><b>Fresh</b> every order</span></div></div><div className="menu-intro__visual" aria-hidden="true"><div className="hero-plate"><span>🍕</span></div><div className="hero-tag hero-tag--top">Made to order</div><div className="hero-tag hero-tag--bottom">★ 4.9 customer love</div></div></section><div className="app__layout"><MenuList searchQuery={searchQuery} /></div></>
        )}

        {view === "checkout" && (
          <Checkout
            coupon={coupon}
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
      {confirmedOrder && <div className="success-overlay"><div className="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title"><div className="success-modal__mark">✓</div><p className="eyebrow">Order confirmed</p><h2 id="success-title">Thank you for ordering!</h2><p>Your food is being prepared with care. You can follow every step of your delivery from the tracker.</p><div className="success-modal__order"><span>Order reference</span><strong>#{confirmedOrder.id?.slice(-8)}</strong></div><button type="button" className="btn btn--primary btn--full" onClick={() => setConfirmedOrder(null)}>Track my order</button></div></div>}
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
