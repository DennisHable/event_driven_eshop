import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Store, LogOut, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext'; // poskytuje operace nad košíkem
import { useAuth } from '../context/AuthContext'; // poskytuje operace nad správou uživatele

export default function Navbar() {
    const { getCartCount } = useCart(); // vytáhneme funkci pro počet položek v košíku
    const { user, logout } = useAuth(); // vytáhneme přihlášeného uživatele (nebo null) a funkci pro odhlášení

    return (
        <nav className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">

                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2 text-white font-bold text-lg hover:text-emerald-400 transition-colors">
                    <Store size={22} className="text-emerald-500" />
                    <span>E-Shop</span>
                </Link>

                {/* Pravá ovládací část */}
                <div className="flex items-center space-x-6">
                    {/* Košík */}
                    <Link to="/cart" className="flex items-center space-x-1.5 text-zinc-400 hover:text-white transition-colors group">
                        <div className="relative">
                            <ShoppingCart size={20} className="group-hover:text-emerald-400 transition-colors" />
                            {getCartCount() > 0 && (
                                <span className="absolute -top-2 -right-2 bg-emerald-500 text-zinc-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {getCartCount()}
                </span>
                            )}
                        </div>
                        <span className="text-sm hidden sm:inline">Košík</span>
                    </Link>

                    {/* Přihlášený uživatel vs. Host */}
                    {user ? (
                        <>
                            {/* pokud je uživatel ADMIN, zobrazíme mu tlačítko pro přidání nového zboží */}
                            {user.roles.includes('ROLE_ADMIN') && (
                                <Link to="/admin/product/new" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer">
                                    <span className="text-sm font-semibold">+ Přidat produkt</span>
                                </Link>
                            )}

                            {/* když je přihlášen */}
                            {/* Odkaz do osobního profilu se jménem uživatele */}
                            <Link to="/profile" className="flex items-center space-x-1.5 text-zinc-300 hover:text-emerald-400 transition-colors group">
                                <User size={20} className="text-emerald-500" />
                                <span className="text-sm font-semibold">{user.username}</span>
                            </Link>

                            {/* Tlačítko odhlásit */}
                            <button
                                onClick={logout}
                                className="flex items-center space-x-1 text-zinc-500 hover:text-rose-400 transition-colors text-sm font-medium cursor-pointer"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline">Odhlásit</span>
                            </button>
                        </>
                    ) : (
                        <>
                            {/* když nikdo není přihlášen */}
                            <Link to="/auth" className="flex items-center space-x-1.5 text-zinc-400 hover:text-white transition-colors group">
                                <LogIn size={20} className="group-hover:text-emerald-400 transition-colors" />
                                <span className="text-sm">Přihlásit se</span>
                            </Link>
                        </>
                    )}
                </div>

            </div>
        </nav>
    );
}
