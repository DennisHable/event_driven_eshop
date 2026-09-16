import React, { useState, useEffect } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
    const [enrichedItems, setEnrichedItems] = useState([]); // nově načteno z DB (název, cena, obrázek,...)
    const [loading, setLoading] = useState(true);
    const [orderStatus, setOrderStatus] = useState({ success: '', error: '' }); // stav pro zobrazení úspěchu/chyby
    const navigate = useNavigate();

    // stažení dat; spustí se jen jednou při otevření košíku
    useEffect(() => {
        if (cartItems.length === 0) { // v košíku nic není, nebude se nic načítat a zobrazí se stránka
            setEnrichedItems([]);
            setLoading(false);
            return;
        }

        const promises = cartItems.map(item => // map() vytvoří nové pole (pole které obsahuje Promises pro každý požadavek) a paralelně (řeší prohlížeč) se spustí síťové požadavky na backend
            fetch(`/api/products/${item.id}`) // backend adresa pro info o konkrétním produktu; vrací (zatím) prázdný Promise
                .then(res => res.ok ? res.json() : null) // až backend odpoví, stav ok (status nastavuje prohlížeč z HTTP hlavičky odpovědi), tak se převede text na JS objekt z toho JSONu
                .then(freshProduct => freshProduct ? {...item, product: freshProduct} : null) // pak se převedený objekt z JSONu (produkt); vezme se starý item s id, počtem vybraných kusů a přidá se "product" což jsou data z backendu
        );

        Promise.all(promises) // dostane pole Promises (jejich počet je roven počtu požadavků na backend); čeká až síťovka přenese data pro všechny produkty; až je vše staženo a načteno, tak se spustí then, kde v results je to pole teď už objektů produkt
            .then(results => {
                setEnrichedItems(results.filter(r => r !== null)); // vymaže položky které na serveru neexistovali; uloží do položek pro zobrazení
                setLoading(false);
            });
    }, []); // prázdný list; fetch se nespustí znovu při klikání na tlačítka


    // funkce pro odeslání objednávky
    const handleCheckout = () => {
        setLoading(true);
        setOrderStatus({ success: '', error: '' }); // Vyčistíme staré stavy

        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cartItems.map(item => ({ id: item.id, quantity: item.quantity }))
            })
        })
            .then(async (res) => { // kvůli await musí být anonymní fce označena async
                // firewall check; pokud Symfony zablokoval přístup (401), JSON v těle není (nedostalo se to ani do kontroleru)
                if (res.status === 401) {
                    throw new Error('Pro dokončení objednávky se musíte nejdříve přihlásit.');
                }

                // přečteme JSON tělo bez ohledu na status; nejdřív se načetli hlavičky, to se výše zkontrolovalo, otevře se asynchronní blok, zastaví se vykonávání díky await, dokud OS a prohlížeč nenačte celý JSON text ze sítě, JS vlákno nečeká; prohlížeč hodí zpárvu do event loop, JS vlákno to pak zpracuje
                const data = await res.json();

                if (!res.ok) {
                    // Pokud server vrátil např. chybu 400 (Nedostatek skladu), vyhodíme zprávu z DB
                    throw new Error(data.error || 'Vytvoření objednávky selhalo.');
                }
                return data;
            })
            .then((data) => {
                // Úspěch: Všechno se srovnalo v pořádku
                setOrderStatus({ success: data.success, error: '' });
                clearCart(); // Vymaže counter v Navbaru i localStorage
                setEnrichedItems([]); // Vymaže produkty z obrazovky košíku
                setLoading(false);

                navigate(`/payment/${data.orderId}`);
            })
            .catch(err => {
                setOrderStatus({ success: '', error: err.message });
                setLoading(false);
            });
    };



    // 2. LOKÁLNÍ HANDLERY: Okamžitě změní množství na obrazovce i v globálním Contextu
    const handleLocalQuantityChange = (productId, currentQty, isIncrement) => {
        const newQty = isIncrement ? currentQty + 1 : currentQty - 1;
        if (newQty < 1) return;

        // Upravíme zobrazení na aktuální stránce
        setEnrichedItems(prev =>
            prev.map(item => item.id === productId ? { ...item, quantity: newQty } : item)
        );

        // Synchronizujeme s globálním Contextu (a localStorage)
        updateQuantity(productId, newQty);
    };

    const handleLocalRemove = (productId) => {
        setEnrichedItems(prev => prev.filter(item => item.id !== productId));
        removeFromCart(productId);
    };

    const calculateTotal = () => {
        return enrichedItems.reduce((total, item) => total + (parseFloat(item.product?.price || 0) * item.quantity), 0);
    };

    if (loading) {
        return <div className="text-center py-16 text-zinc-500 animate-pulse">Ověřuji aktuální ceny na serveru...</div>;
    }

    if (enrichedItems.length === 0) {
        return (
            <div className="text-center py-16 bg-zinc-900/10 border border-zinc-800/60 rounded-2xl max-w-2xl mx-auto space-y-4">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                    <ShoppingBag size={28} />
                </div>
                <h2 className="text-xl font-bold text-white">Váš košík je prázdný</h2>
                <Link to="/" className="inline-flex items-center bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors cursor-pointer">
                    Prohlížet katalog produktů
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-white tracking-tight">Nákupní košík</h1>

            {/* hlášky o stavu objednávky pod nadpis, kvůli přehlednosti */}
            {orderStatus.error && <div className="p-4 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium animate-in fade-in duration-200">{orderStatus.error}</div>}
            {orderStatus.success && <div className="p-4 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium animate-in fade-in duration-200">{orderStatus.success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* seznam položek v košíku */}
                <div className="lg:col-span-2 space-y-4">
                    {/* vezme pole produktů a převede ho na pole JSX elementů; React to vykreslí jako sekvenci HTML prvků pod sebou; díky "key" pak může mazat jen konkrétní element a nemusí rerenderovat vše */}
                    {enrichedItems.map((item) => (
                        <div key={item.id} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <div className="w-20 h-20 bg-zinc-950 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800/40">
                                    <img src={`https://images.unsplash.com/${item.product?.imageUrl}?w=150&auto=format&fit=crop&q=60`} alt={item.product?.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm line-clamp-1">{item.product?.name}</h3>
                                    <p className="text-xs text-zinc-500 mt-0.5">{item.product?.category}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-transparent border-zinc-800/60">
                                <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                                    <button
                                        onClick={() => handleLocalQuantityChange(item.id, item.quantity, false)}
                                        disabled={item.quantity <= 1}
                                        className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="text-sm font-semibold text-white px-2 w-8 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => handleLocalQuantityChange(item.id, item.quantity, true)}
                                        disabled={item.quantity >= (item.product?.stock || 99)}
                                        className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <div className="text-right min-w-[90px] hidden sm:block">
                                    <p className="text-white font-bold text-sm">{(parseFloat(item.product?.price || 0) * item.quantity).toLocaleString('cs-CZ')} Kč</p>
                                    <p className="text-[10px] text-zinc-500 font-medium">{parseFloat(item.product?.price || 0).toLocaleString('cs-CZ')} Kč/ks</p>
                                </div>

                                <button onClick={() => handleLocalRemove(item.id)} className="p-2 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800/50 transition-all cursor-pointer">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* shrnutí objednávky */}
                <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-2xl p-6 shadow-2xl space-y-6 lg:sticky top-24">
                    <h2 className="text-white font-bold text-base border-b border-zinc-800 pb-3">Shrnutí nákupu</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-zinc-400">
                            <span>Mezisoučet zboží</span>
                            <span className="text-zinc-200 font-medium">{calculateTotal().toLocaleString('cs-CZ')} Kč</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Doprava</span>
                            <span className="text-emerald-400 font-semibold">ZDARMA</span>
                        </div>
                        <div className="pt-4 border-t border-zinc-800/80 flex justify-between items-baseline">
                            <span className="text-white font-semibold">Celkem k úhradě</span>
                            <span className="text-emerald-400 font-black text-xl">{calculateTotal().toLocaleString('cs-CZ')} Kč</span>
                        </div>
                    </div>
                    <div className="pt-2 space-y-3">
                        {orderStatus.error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium">{orderStatus.error}</div>}
                        {orderStatus.success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">{orderStatus.success}</div>}

                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:bg-zinc-800 disabled:text-zinc-600 font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
                        >
                            <span>{loading ? 'Zpracovávám...' : 'Odeslat závaznou objednávku'}</span>
                            <ArrowRight size={16} />
                        </button>
                        <button
                            onClick={() => { clearCart(); setEnrichedItems([]); }}
                            className="w-full text-zinc-500 hover:text-zinc-400 text-xs font-medium py-1 transition-colors cursor-pointer"
                        >
                            Vysypat celý košík
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
