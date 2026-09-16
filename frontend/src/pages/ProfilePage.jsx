import React, { useState, useEffect } from 'react';
import {Link} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Clock, CheckCircle, AlertCircle, Calendar, CreditCard } from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth(); // data o přihlášeném uživateli
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return; // nikdo není přihlášen

        fetch('/api/orders/history') // historie všech objednávek pro daného uživatele
            .then(res => res.ok ? res.json() : []) // převedeme na JSON (pokud je odpověď OK)
            .then(data => { // JSON převedený na objekty uložíme do pole objednávek
                setOrders(data);
                setLoading(false);
            })
            .catch(() => {
                setOrders([]);
                setLoading(false);
            });
    }, [user]); // při změně přihlášeného uživatele se provede načtení

    if (!user) {
        return (
            <div className="text-center py-16 bg-zinc-900/10 border border-zinc-800/60 rounded-2xl max-w-md mx-auto space-y-4">
                <AlertCircle size={32} className="text-zinc-500 mx-auto" />
                <h2 className="text-lg font-bold text-white">Přístup odepřen</h2>
                <p className="text-zinc-500 text-sm">Pro zobrazení profilu a historie objednávek se musíte přihlásit.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* uživatelské info */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold text-lg uppercase">
                    {user.username.charAt(0)}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{user.username}</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">{user.email}</p>
                </div>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <Package size={18} className="text-emerald-500" />
                <span>Moje objednávky ({orders.length})</span>
            </h3>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => <div key={i} className="bg-zinc-900/20 border border-zinc-800/50 h-28 rounded-xl animate-pulse" />)}
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/10 border border-zinc-800/40 rounded-xl text-zinc-500 text-sm">
                    Zatím jste u nás nevytvořil žádnou objednávku.
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 shadow-lg space-y-4">
                            {/* karta objednávky (hlavička) */}
                            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-zinc-800 pb-3">
                                <div className="flex items-center space-x-6 text-xs text-zinc-400">
                                    <div>
                                        <span className="block text-zinc-500 font-medium uppercase text-[9px] tracking-wider mb-0.5">Číslo objednávky</span>
                                        <span className="text-white font-semibold"># {order.id}</span>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                        <Calendar size={14} className="text-zinc-500" />
                                        <div>
                                            <span className="block text-zinc-500 font-medium uppercase text-[9px] tracking-wider mb-0.5">Datum nákupu</span>
                                            <span className="text-zinc-200 font-medium">{order.createdAt}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* stav */}
                                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                    order.status === 'PAID'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                                }`}>
                  {order.status === 'PAID' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                    <span>{order.status === 'PAID' ? 'Zaplaceno' : 'Čeká na platbu'}</span>
                </span>
                            </div>

                            {/* seznam zakoupených věcí v této objednávce */}
                            <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="text-zinc-300 font-medium">
                                            {item.productName} <span className="text-zinc-500 text-xs font-normal">x {item.quantity}</span>
                                        </div>
                                        <span className="text-zinc-400 text-xs">{(parseFloat(item.price) * item.quantity).toLocaleString('cs-CZ')} Kč</span>
                                    </div>
                                ))}
                            </div>

                            {/* spodní řádek s cenou + tlačítko  */}
                            <div className="pt-3 border-t border-zinc-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-zinc-500">
                                <div className="flex items-center space-x-1">
                                    <CreditCard size={14} />
                                    <span>Platební metoda: Online kartou</span>
                                </div>

                                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                    {/* tlačítko pro opakování platby; ukáže se pouze pokud objednávka není zaplacená */}
                                    {order.status !== 'PAID' && (
                                        <Link
                                            to={`/payment/${order.id}`}
                                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold px-3 py-1.5 rounded-lg border border-amber-500/20 transition-colors cursor-pointer"
                                        >
                                            Opakovat platbu
                                        </Link>
                                    )}

                                    <div className="text-right sm:text-left">
                                        Celková cena: <span className="text-emerald-400 font-black text-base ml-1">{parseFloat(order.totalPrice).toLocaleString('cs-CZ')} Kč</span>
                                    </div>
                                </div>
                            </div>


                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
