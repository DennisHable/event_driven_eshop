import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, X, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

export default function MainPage() {
    const [products, setProducts] = useState([]); // render bere výchozí hodnotu; rerender ignoruje tu výchozí
    const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const [loading, setLoading] = useState(true);
    const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState(5000); // strop na cenu z DB

    const [search, setSearch] = useState('');
    const [minPrice, setMinPrice] = useState('0');
    const [maxPrice, setMaxPrice] = useState('5000');

    // stavy pro backend dotazy; jejich nastavení proběhne po určité době
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [debouncedMinPrice, setDebouncedMinPrice] = useState('0');
    const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('5000');

    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const categories = ['Elektronika', 'Oblečení', 'Knihy', 'Sport'];

    const step = 5;

    // načtení max ceny z DB hned při startu (pro filtry dle ceny)
    useEffect(() => {
        fetch('/api/products/max-price')
            .then(res => res.json()) // přišel začátek HTTP hlavičky, považuje za zodpovězeno a spustí then; json() na pozadí začne asynchronně načítat zbytek bajtů ze sítě a až to dočte převede to na JS objekt
            .then(data => {
                const price = Math.ceil(data.maxPrice) - Math.ceil(data.maxPrice) % step + step;
                setAbsoluteMaxPrice(price);
                setMaxPrice(price.toString());
                setDebouncedMaxPrice(price.toString());
            })
            .catch(() => {});
    }, []);

    // debounce časovač (500ms); s každým stiskem klávesy při vyhledávání se mění "search" tedy spustí se tento useEffect
    useEffect(() => {
        const timer = setTimeout(() => { // po 500ms se spustí a upraví hodnoty pro provedení reálného dotazu na backend
            setDebouncedSearch(search);
            setDebouncedMinPrice(minPrice);
            setDebouncedMaxPrice(maxPrice);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer); // když uživatel píše kontinuálně, spustí se clean-up fce, která zničí předchozí časovač; tedy dokud nebude od posledního stistku klávesy při psaní těch 500ms, tak se dotaz na backend nespustí; clear se spustí (odloženě) až po dalším spuštění useEffect; vrací jádru Reactu tu anonymní funkci, ten ji tedy spustí při dalším volání (nebo když odejde z MainPage)
    }, [search, minPrice, maxPrice]);

    const fetchProducts = (currentSearch, currentCategory, currentMin, currentMax, currentPage) => {
        setLoading(true);
        const params = new URLSearchParams({ page: currentPage.toString(), limit: '6' }); // sestavování params do URL adresy
        if (currentSearch) params.append('search', currentSearch);
        if (currentCategory) params.append('category', currentCategory);
        if (currentMin) params.append('minPrice', currentMin);
        if (currentMax) params.append('maxPrice', currentMax);

        fetch(`/api/products?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                setProducts(data.products);
                setMeta(data.meta);
                setLoading(false);
            })
            .catch((err) => { console.error(err); setLoading(false); });
    };

    useEffect(() => {
        fetchProducts(debouncedSearch, category, debouncedMinPrice, debouncedMaxPrice, page);
    }, [debouncedSearch, category, debouncedMinPrice, debouncedMaxPrice, page]); // až uplyne ta doba v debounce časovači, tak se spustí toto, což načte data přes tu funkci z backendu

    const handleResetFilters = () => {
        setSearch(''); setDebouncedSearch(''); setCategory(''); setPage(1);
        setMinPrice('0'); setDebouncedMinPrice('0');
        setMaxPrice(absoluteMaxPrice.toString()); setDebouncedMaxPrice(absoluteMaxPrice.toString());
        fetchProducts('', '', '0', absoluteMaxPrice.toString(), 1);
    };


    return (
        <div className="space-y-6">
            {/* horní vyhledávací lišta */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-900/40 p-4 border border-zinc-800/60 rounded-xl">
                <div className="relative w-full sm:max-w-md">
                    <input
                        type="text"
                        placeholder="Vyhledat produkt (automatické hledání)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <Search size={18} className="absolute left-3 top-2.5 text-zinc-500" />
                </div>
                <button onClick={() => setIsMobileFilterOpen(true)} className="lg:hidden flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-4 py-2 rounded-lg text-sm justify-center cursor-pointer"><SlidersHorizontal size={16} /><span>Filtry</span></button>
                <div className="text-xs text-zinc-500 hidden sm:block">Nalezeno celkem <span className="text-zinc-300 font-semibold">{meta.totalItems}</span> produktů</div>
            </div>

            <div className="flex gap-8 items-start">
                {/* desktop filtry */}
                <aside className="hidden lg:block w-64 bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 sticky top-24">
                    <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-zinc-800"><Filter size={16} className="text-emerald-500" /><h2 className="text-white font-semibold text-sm">Filtrovat zboží</h2></div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Kategorie</h3>
                            <div className="space-y-2">
                                <button onClick={() => { setCategory(''); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${category === '' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent'}`}>Všechno zboží</button>
                                <div className="h-px bg-zinc-800/60 my-2" />
                                {categories.map((cat) => (
                                    <button key={cat} onClick={() => { setCategory(cat); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${category === cat ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent'}`}>{cat}</button>
                                ))}
                            </div>
                        </div>

                        {/* dvojitý slider */}
                        <div className="pt-4 border-t border-zinc-800/60 space-y-5">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Cenové rozpětí</h3>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] text-zinc-400">
                                    <span>Od: <strong className="text-emerald-400">{parseInt(minPrice).toLocaleString()} Kč</strong></span>
                                    <span>Do: <strong className="text-emerald-400">{parseInt(maxPrice).toLocaleString()} Kč</strong></span>
                                </div>

                                {/* Překryvné posuvníky */}
                                <div className="relative h-2 w-full mt-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max={absoluteMaxPrice}
                                        step={step}
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(Math.min(Number(e.target.value), Number(maxPrice) - 50).toString())}
                                        className="absolute w-full accent-emerald-500 h-1 bg-transparent rounded-lg appearance-none cursor-pointer z-30 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max={absoluteMaxPrice}
                                        step={step}
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), Number(minPrice) + 50).toString())}
                                        className="absolute w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer z-10 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                                    />
                                </div>


                            </div>

                            {/* políčka pro zadání ceny */}
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    placeholder="Min Kč"
                                    value={minPrice}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Povolíme prázdný řetězec při psaní, jinak omezíme shora (maxPrice - step)
                                        if (val === "") { setMinPrice(""); }
                                        else { setMinPrice(Math.min(Number(val), Number(maxPrice) - step).toString()); }
                                    }}
                                    onBlur={() => {
                                        // při opuštění políčka opravíme případnou nulu nebo prázdnou hodnotu
                                        if (!minPrice || Number(minPrice) < 0) setMinPrice("0");
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-zinc-700 text-xs">—</span>
                                <input
                                    type="number"
                                    placeholder="Max Kč"
                                    value={maxPrice}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // povolíme prázdný řetězec, jinak omezíme zdola (minPrice + step)
                                        if (val === "") { setMaxPrice(""); }
                                        else { setMaxPrice(Math.max(Number(val), Number(minPrice) + step).toString()); }
                                    }}
                                    onBlur={() => {
                                        // při opuštění políčka nepovolíme hodnotu vyšší než absolutní maximum
                                        if (Number(maxPrice) > Number(absoluteMaxPrice)) setMaxPrice(absoluteMaxPrice.toString());
                                        if (!maxPrice) setMaxPrice((Number(absoluteMaxPrice)).toString());
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>

                        </div>

                        <div className="pt-4 border-t border-zinc-800"><button onClick={handleResetFilters} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2 rounded-lg text-xs transition-colors cursor-pointer">Vymazat filtry</button></div>
                    </div>
                </aside>

                {/* mobilní filtry */}
                {isMobileFilterOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />
                        <div className="relative ml-0 mr-auto flex h-full w-full max-w-xs flex-col bg-zinc-900 p-6 shadow-xl border-r border-zinc-800">
                            <div className="flex items-center justify-between mb-6">
                <span className="text-white font-bold text-base flex items-center space-x-2">
                  <Filter size={18} className="text-emerald-500" />
                  <span>Filtry</span>
                </span>
                                <button onClick={() => setIsMobileFilterOpen(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Kategorie</h3>
                                    <div className="space-y-2">
                                        <button onClick={() => { setCategory(''); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${category === '' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent'}`}>Všechno zboží</button>
                                        <div className="h-px bg-zinc-800/60 my-2" />
                                        {categories.map((cat) => (
                                            <button key={cat} onClick={() => { setCategory(cat); setPage(1); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${category === cat ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent'}`}>{cat}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* dvojitý slider */}
                                <div className="pt-4 border-t border-zinc-800/60 space-y-5">
                                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Cenové rozpětí</h3>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] text-zinc-400">
                                            <span>Od: <strong className="text-emerald-400">{parseInt(minPrice).toLocaleString()} Kč</strong></span>
                                            <span>Do: <strong className="text-emerald-400">{parseInt(maxPrice).toLocaleString()} Kč</strong></span>
                                        </div>

                                        {/* Překryvné posuvníky */}
                                        <div className="relative h-2 w-full mt-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max={absoluteMaxPrice}
                                                step={step}
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(Math.min(Number(e.target.value), Number(maxPrice) - 50).toString())}
                                                className="absolute w-full accent-emerald-500 h-1 bg-transparent rounded-lg appearance-none cursor-pointer z-30 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                                            />
                                            <input
                                                type="range"
                                                min="0"
                                                max={absoluteMaxPrice}
                                                step={step}
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), Number(minPrice) + 50).toString())}
                                                className="absolute w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer z-10 pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                                            />
                                        </div>


                                    </div>

                                    {/* políčka pro zadání ceny */}
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            placeholder="Min Kč"
                                            value={minPrice}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // Povolíme prázdný řetězec při psaní, jinak omezíme shora (maxPrice - step)
                                                if (val === "") { setMinPrice(""); }
                                                else { setMinPrice(Math.min(Number(val), Number(maxPrice) - step).toString()); }
                                            }}
                                            onBlur={() => {
                                                // při opuštění políčka opravíme případnou nulu nebo prázdnou hodnotu
                                                if (!minPrice || Number(minPrice) < 0) setMinPrice("0");
                                            }}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="text-zinc-700 text-xs">—</span>
                                        <input
                                            type="number"
                                            placeholder="Max Kč"
                                            value={maxPrice}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // povolíme prázdný řetězec, jinak omezíme zdola (minPrice + step)
                                                if (val === "") { setMaxPrice(""); }
                                                else { setMaxPrice(Math.max(Number(val), Number(minPrice) + step).toString()); }
                                            }}
                                            onBlur={() => {
                                                // při opuštění políčka nepovolíme hodnotu vyšší než absolutní maximum
                                                if (Number(maxPrice) > Number(absoluteMaxPrice)) setMaxPrice(absoluteMaxPrice.toString());
                                                if (!maxPrice) setMaxPrice((Number(absoluteMaxPrice)).toString());
                                            }}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>

                                </div>

                                <div className="pt-4 border-t border-zinc-800"><button onClick={handleResetFilters} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2 rounded-lg text-xs transition-colors cursor-pointer">Vymazat filtry</button></div>
                            </div>
                        </div>
                    </div>
                )}


                {/* mřížka s produkty */}
                <div className="flex-grow w-full">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl h-80 animate-pulse" />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16 bg-zinc-900/20 border border-zinc-800/40 rounded-xl"><p className="text-zinc-500 text-sm">Žádné produkty neodpovídají zvoleným filtrům.</p></div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <Link key={product.id} to={`/product/${product.id}`} className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden hover:border-zinc-700/80 transition-all flex flex-col group shadow-lg cursor-pointer">
                                        <div className="h-44 bg-zinc-950 overflow-hidden relative">
                                            <img src={`https://images.unsplash.com/${product.imageUrl}?w=400&auto=format&fit=crop&q=60`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                            <span className="absolute top-2 right-2 bg-zinc-900/90 text-zinc-400 text-[11px] font-medium px-2 py-0.5 rounded border border-zinc-800">{product.category}</span>
                                        </div>
                                        <div className="p-4 flex flex-col flex-grow justify-between space-y-4">
                                            <div className="space-y-1">
                                                <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors">{product.name}</h3>
                                                <p className="text-zinc-400 text-xs line-clamp-2 font-light leading-relaxed">{product.description}</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                                                <span className="text-emerald-400 font-extrabold text-sm">{parseFloat(product.price).toLocaleString('cs-CZ')} Kč</span>
                                                <span className={`text-[11px] font-medium ${product.stock > 0 ? 'text-zinc-500' : 'text-rose-500/80'}`}>{product.stock > 0 ? `Skladem (${product.stock} ks)` : 'Vyprodáno'}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* výběr strany */}
                            {meta.totalPages > 1 && (
                                <div className="flex items-center justify-center space-x-2 pt-4">
                                    <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"><ChevronLeft size={18} /></button>
                                    <div className="text-sm font-medium text-zinc-400 px-4">Strana <span className="text-white font-bold">{page}</span> z <span className="text-white font-bold">{meta.totalPages}</span></div>
                                    <button onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))} disabled={page === meta.totalPages} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"><ChevronRight size={18} /></button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
