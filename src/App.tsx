import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { Cart } from "./components/layout/Cart";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { Product } from "./pages/Product";
import { Checkout } from "./pages/Checkout";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Wishlist } from "./pages/Wishlist";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { Admin } from "./pages/Admin";
import { TrackOrder } from "./pages/TrackOrder";
import { Orders } from "./pages/Orders";
import { useProductsStore } from "./store/useProductsStore";
import { ToastContainer } from "./components/ui/Toast";

export default function App() {
  const initializeProducts = useProductsStore(state => state.initialize);
  
  useEffect(() => {
    initializeProducts();
  }, [initializeProducts]);

  return (
    <Router>
      <div className="font-sans text-[#141414] selection:bg-[#141414] selection:text-white min-h-screen flex flex-col bg-[#FAFAFA]">
        <Navbar />
        <Cart />
        <ToastContainer />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
