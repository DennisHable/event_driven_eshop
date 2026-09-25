import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {ArrowLeft, ShoppingCart, CheckCircle, XCircle, Minus, Plus} from 'lucide-react';
import { useCart } from '../context/CartContext';
export default function ProductDetailPage() {
    const { id } = useParams(); // vytáhne id produktu z URL (např.: z /product/15 vytáhne "15")
    const navigate = useNavigate(); // hook pro přesměrování

    const [product, setProduct] = useState(null); // načtený produkt
    const [loading, setLoading] = useState(true); // načítačí kolečko
    const [quantity, setQuantity] = useState(1); // počet vybraných kusů té položky

    const { addToCart, cartItems } = useCart();  // přidání do košíku; položky v košíku (pro výpočet kolik ještě lze přidat položek do maxima (skladem))

    useEffect(() => {
        fetch(`/api/products/${id}`) // info o produktu
            .then((res) => {
                if (!res.ok) throw new Error('Produkt nenalezen');
                return res.json();
            })
            .then((data) => {
                setProduct(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [id]); // při změně id prodkutu


    const handleDelete = () => { // smazání produktu ADMINEM z DB
        if (window.confirm(`Opravdu chcete produkt "${product.name}" definitivně smazat z katalogu?`)) {
            fetch(`/api/admin/product/delete/${product.id}`, {
                method: 'DELETE'
            })
                .then(res => {
                    if (!res.ok) throw new Error('Smazání selhalo');
                    navigate('/'); // po smazání redirect na hlavní stranu
                })
                .catch(err => alert(err.message));
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-8 max-w-5xl mx-auto pt-4">
                <div className="h-6 w-24 bg-zinc-800 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-96 bg-zinc-900 rounded-xl" />
                    <div className="space-y-4">
                        <div className="h-8 w-2/3 bg-zinc-900 rounded" />
                        <div className="h-4 w-1/4 bg-zinc-900 rounded" />
                        <div className="h-24 w-full bg-zinc-900 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-16">
                <p className="text-rose-500 mb-4">Produkt se nepodařilo načíst.</p>
                <Link to="/" className="text-emerald-400 hover:underline flex items-center justify-center space-x-1">
                    <ArrowLeft size={16} /> <span>Zpět na hlavní stranu</span>
                </Link>
            </div>
        );
    }

    // výpočet limitů; spustí se při každém rerenderu (změna stavu)
    // najdeme v košíku, kolik kusů tohoto konkrétního produktu už uživatel v košíku má (pokud tam ten produkt má)
    const itemInCart = product ? cartItems.find(item => item.id === product.id) : null;
    const quantityInCart = itemInCart ? itemInCart.quantity : 0;
    // maximální množství, které uživatel ještě smí na detailu produktu přidat do košíku
    const maxAvailableToBuy = product ? product.stock - quantityInCart : 0;


    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* tlačítko zpět */}
            <button
                onClick={() => navigate(-1)} // vrátí uživatele na předchozí stránku v historii
                className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm font-medium"
            >
                <ArrowLeft size={16} />
                <span>Zpět do katalogu</span>
            </button>


            {/* panel jen pro admina */}
            {user && user.roles.includes('ROLE_ADMIN') && (
                <div className="flex items-center space-x-3 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-2 border-r border-zinc-800 pr-3">Admin akce</span>
                    <Link
                        to={`/admin/product/edit/${product.id}`} // jen redirect na stránku pro editaci
                        className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                        <Edit size={14} /><span>Upravit texty/cenu</span>
                    </Link>
                    <button
                        onClick={handleDelete} // volání funkce pro smazání z DB
                        className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors cursor-pointer ml-2"
                    >
                        <Trash2 size={14} /><span>Smazat z e-shopu</span>
                    </button>
                </div>
            )}

            {/* hlavní blok detailu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-zinc-900/20 border border-zinc-800/60 rounded-2xl p-6 md:p-8 shadow-2xl">

                {/* levá strana; obrázek */}
                <div className="bg-zinc-950 rounded-xl overflow-hidden h-96 border border-zinc-800/40">
                    <img
                        src={`https://images.unsplash.com/${product.imageUrl}?w=600&auto=format&fit=crop&q=80`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* pravá strana; info o produktu + možnost nákupu */}
                <div className="flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                        <div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                {product.category}
              </span>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-3">
                                {product.name}
                            </h1>
                        </div>

                        <p className="text-zinc-400 text-sm font-light leading-relaxed">
                            {product.description}
                        </p>

                        {/* skladovost */}
                        <div className="flex items-center space-x-2 text-sm pt-2">
                            {product.stock > 0 ? (
                                <>
                                    <CheckCircle size={18} className="text-emerald-500" />
                                    <span className="text-zinc-300">Skladem k okamžitému odeslání ({product.stock} ks)</span>
                                </>
                            ) : (
                                <>
                                    <XCircle size={18} className="text-rose-500" />
                                    <span className="text-rose-400 font-medium">Momentálně vyprodáno</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* cena */}
                    <div className="pt-6 border-t border-zinc-800/80 space-y-4">
                        <div className="flex items-baseline justify-between">
                            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Cena za kus</span>
                            <span className="text-emerald-400 font-black text-2xl md:text-3xl">
                {parseFloat(product.price).toLocaleString('cs-CZ')} Kč
              </span>
                        </div>

                        {product.stock > 0 && (
                            <div className="flex gap-4 items-center pt-2">
                                {/* volba množství produktu */}
                                <div className="flex flex-col space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Množství</label>
                                    <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1}
                                            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="text-sm font-semibold text-white px-2 w-8 text-center">{maxAvailableToBuy <= 0 ? 0 : quantity}</span>
                                        <button
                                            onClick={() => setQuantity(prev => Math.min(maxAvailableToBuy, prev + 1))}
                                            disabled={quantity >= maxAvailableToBuy || maxAvailableToBuy <= 0}
                                            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* tlačítko pro přidání do košíku; zablokujeme ho, pokud uživatel vykoupil celý sklad */}
                                <button
                                    onClick={() => { addToCart(product, quantity); setQuantity(1); }}
                                    disabled={maxAvailableToBuy <= 0}
                                    className="flex-grow bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:bg-zinc-800 disabled:text-zinc-600 font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 cursor-pointer mt-5"
                                >
                                    <ShoppingCart size={18} />
                                    <span>{maxAvailableToBuy <= 0 ? 'Sklad vyčerpán' : 'Přidat do košíku'}</span>
                                </button>

                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
