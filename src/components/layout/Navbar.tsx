import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, Instagram, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  
  const toggleCart = useCartStore((state) => state.toggleCart);
  const items = useCartStore((state) => state.items);
  const { user, isAdmin } = useAuthStore();

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
    setUserMenuOpen(false);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Track Order", path: "/track" },
  ];

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 md:px-10 py-6 items-center flex justify-between",
          isScrolled || mobileMenuOpen ? "bg-[#FAFAFA] text-[#141414] border-b border-black/5" : "bg-transparent text-[#141414] border-b border-black/5"
        )}
      >
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden pt-1" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <Link to="/">
            <h1 className="font-heading font-black text-2xl tracking-tighter uppercase whitespace-nowrap">
              Arlo Boudha
            </h1>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-10 text-[11px] font-bold uppercase tracking-widest relative">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            
            if (link.name === "Shop") {
              return (
                <div key={link.name} className="relative group">
                  <Link 
                    to={link.path}
                    className={cn(
                      "hover:opacity-50 transition-opacity flex items-center gap-1",
                      isActive ? "border-b-2 border-[#141414] py-1" : "py-1"
                    )}
                  >
                    {link.name}
                  </Link>
                  
                  {/* Shop Mega Dropdown */}
                  <div className="absolute top-full left-0 mt-4 w-64 bg-white border border-black/5 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-bold border-b border-black/10 pb-2 mb-3 text-[#141414]/50">Uppers</h3>
                        <ul className="space-y-3">
                          {['Tshirts', 'Shirts', 'Jackets', 'Hoodies'].map(sub => (
                            <li key={sub}>
                              <Link to={`/shop?category=${sub}`} className="hover:text-black/50 transition-colors block">{sub}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-bold border-b border-black/10 pb-2 mb-3 text-[#141414]/50">Lowers</h3>
                        <ul className="space-y-3">
                          {['Pants', 'Trousers', 'Shorts'].map(sub => (
                            <li key={sub}>
                              <Link to={`/shop?category=${sub}`} className="hover:text-black/50 transition-colors block">{sub}</Link>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-6">
                          <Link to="/shop?category=Essentials" className="font-bold border-b border-black/10 pb-2 mb-3 text-[#141414]/50 block hover:text-black/50 transition-colors">Essentials</Link>
                          <Link to="/shop?category=Accessories" className="font-bold border-b border-black/10 pb-2 mb-3 text-[#141414]/50 block hover:text-black/50 transition-colors">Accessories</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link 
                key={link.name} 
                to={link.path}
                className={cn(
                  "hover:opacity-50 transition-opacity",
                  isActive ? "border-b-2 border-[#141414] py-1" : "py-1"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-6 text-[11px] font-bold uppercase tracking-widest relative">
          <Link to="/wishlist" className="hover:opacity-50 transition-opacity hidden md:block">
            Wishlist
          </Link>

          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="hover:opacity-50 transition-opacity flex items-center gap-2"
            >
              <User size={16} />
              <span className="hidden md:block">{user ? (isAdmin ? 'Admin' : 'Account') : 'Login'}</span>
            </button>

            {/* User Dropdown */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-4 w-48 bg-white border border-black/5 shadow-xl py-2 flex flex-col z-50 text-[10px]"
                >
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-black/5 mb-2 truncate text-[#141414]/50">
                        {user.email}
                      </div>
                      {isAdmin ? (
                        <Link to="/admin" className="px-4 py-2 hover:bg-black/5 transition-colors">
                          Admin Portal
                        </Link>
                      ) : (
                        <Link to="/orders" className="px-4 py-2 hover:bg-black/5 transition-colors">
                          Order History
                        </Link>
                      )}
                      <Link to="/wishlist" className="px-4 py-2 hover:bg-black/5 transition-colors md:hidden">
                        Wishlist
                      </Link>
                      <button onClick={handleSignOut} className="px-4 py-2 hover:bg-black/5 transition-colors text-left flex items-center gap-2 text-red-500">
                        <LogOut size={12} /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="px-4 py-2 hover:bg-black/5 transition-colors text-center font-bold">
                        Sign In
                      </Link>
                      <Link to="/signup" className="px-4 py-2 hover:bg-black/5 transition-colors text-center text-[#141414]/50">
                        Create Account
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={toggleCart} className="relative cursor-pointer group flex items-center gap-2">
            <ShoppingBag size={16} />
            <span className="group-hover:opacity-50 transition-opacity hidden md:block">Cart</span>
            {itemCount > 0 ? (
              <span className="absolute -top-2 -right-3 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            ) : (
              <span className="absolute -top-2 -right-3 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                0
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 pb-6 flex flex-col"
          >
            <div className="flex flex-col gap-6 text-2xl font-heading font-medium overflow-y-auto pb-8">
              {navLinks.map((link) => (
                <div key={link.name} className="flex flex-col">
                  <Link 
                    to={link.path}
                    className="uppercase tracking-widest border-b border-black/5 pb-4"
                  >
                    {link.name}
                  </Link>
                  {link.name === "Shop" && (
                    <div className="pl-4 pt-4 flex flex-col gap-3 text-lg font-sans font-bold uppercase tracking-widest text-[#141414]/60">
                      <div className="text-[10px] text-[#141414]/40 mt-1">UPPERS</div>
                      {['Tshirts', 'Shirts', 'Jackets', 'Hoodies'].map(sub => (
                        <Link key={sub} to={`/shop?category=${sub}`} className="hover:text-black">{sub}</Link>
                      ))}
                      <div className="text-[10px] text-[#141414]/40 mt-3">LOWERS</div>
                      {['Pants', 'Trousers', 'Shorts'].map(sub => (
                        <Link key={sub} to={`/shop?category=${sub}`} className="hover:text-black">{sub}</Link>
                      ))}
                      <div className="text-[10px] text-[#141414]/40 mt-3">MORE</div>
                      <Link to="/shop?category=Essentials" className="hover:text-black">Essentials</Link>
                      <Link to="/shop?category=Accessories" className="hover:text-black">Accessories</Link>
                      <div className="h-4 border-b border-black/5 w-full -ml-4"></div>
                    </div>
                  )}
                </div>
              ))}
              <Link 
                to="/wishlist"
                className="uppercase tracking-widest border-b border-black/5 pb-4"
              >
                Wishlist
              </Link>
            </div>
            <div className="mt-auto pb-8">
              <div className="flex gap-4 mb-4">
                      <a href="https://www.instagram.com/arlo_boudha/" target="_blank" rel="noopener noreferrer" className="p-3 border border-gray-200 rounded-full hover:border-[#141414] transition-colors">
                        <Instagram size={20} />
                      </a>
                      <a href="https://wa.me/9779843402357" target="_blank" rel="noopener noreferrer" className="p-3 border border-gray-200 rounded-full hover:border-[#141414] transition-colors">
                        {/* Simple WhatsApp icon placeholder using text since lucide-react might not have Whatsapp (or just use phone/message icon, let's use an SVG) */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
                      </a>
              </div>
              <p className="text-gray-500 text-sm">Kathmandu, Nepal</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
