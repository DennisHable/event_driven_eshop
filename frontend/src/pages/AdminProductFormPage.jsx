import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, PackagePlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminProductFormPage() {
    const { id } = useParams(); // id existuje => edit; neexistuje => nový produkt
    const navigate = useNavigate();
    const { user, checkAuthStatus } = useAuth();

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('Elektronika');
    const [description, setDescription] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitForm, setSubmitForm] = useState(false);
    const [status, setStatus] = useState({ error: '', success: '' });

    const categories = ['Elektronika', 'Oblečení', 'Knihy', 'Sport']; // TODO načíst z DB

    useEffect(() => { // předvyplnění dat z DB, pokud se jedná o produkt který tam je (editace)
        if (!id) {
            setLoading(false);
            return;
        } // není id, tedy přidáváme nový produkt, nic se nenačítá
        setLoading(true);

        fetch(`/api/products/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Nesprávné id produktu');
                return res.json();
            })
            .then(data => {
                checkAuthStatus();
                setName(data.name);
                setPrice(data.price);
                setStock(data.stock);
                setCategory(data.category);
                setDescription(data.description);
                setLoading(false);
            })
            .catch(err => {
                setStatus({ success: '', error: err.message });
                setLoading(false);
            });
    }, [id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitForm(true);
        setStatus({ error: '', success: '' });

        // endpoint a http metoda na backend dynamicky jestli to je přidání nebo edit
        const url = id ? `/api/admin/product/edit/${id}` : '/api/admin/product/add';
        const method = id ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, price, stock, category, description}) // tělo dotazu, co se pošle na server a upraví/vytvoří se v DB
        })
            .then(res => {
                if (!res.ok) throw new Error(res.error);
                return res.json();
            })
            .then(() => {
                setLoading(false);
                setStatus({ success: 'Vše proběhlo úspěšně', error: '' });
                // přesměrování na hlavní stranu bez reloadu prohlížeče (SPA)
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            })
            .catch(err => {
                setStatus({ success: '', error: err.message });
                setLoading(false);
            });
    };

    if (loading) {
        return <div className="text-center py-16 text-zinc-500 animate-pulse">Načítám data a ověřuji práva uživatele...</div>;
    }

    // nepřihlášený uživatel, nebo běžnému přihlášenému uživateli se to nezobrazí; backend pak dělá ověření sám ovšem
    if (!user || !user.roles.includes('ROLE_ADMIN')) {
        return <div className="text-center py-16 text-rose-500 font-bold">Přístup odepřen. Nemáte administrátorská práva.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors cursor-pointer">
                <ArrowLeft size={16} /><span>Zpět</span>
            </button>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-zinc-800">
                    <PackagePlus className="text-emerald-400" size={22} />
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        {id ? 'Upravit produkt v katalogu' : 'Přidat nový produkt do nabídky'}
                    </h2>
                </div>

                {status.error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium">{status.error}</div>}
                {status.success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">{status.success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Název produktu</label>
                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="Např. Bezdrátová sluchátka" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Cena (Kč)</label>
                            <input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="1290.00" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Počet kusů skladem</label>
                            <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="10" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Kategorie</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer">
                            {categories.map(cat => <option key={cat} value={cat} className="bg-zinc-950">{cat}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Podrobný popis produktu</label>
                        <textarea required rows="4" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none font-light leading-relaxed" placeholder="Zadejte specifikace a parametry produktu..." />
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={submitForm} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer">
                            <Save size={16} /><span>{submitForm ? 'Ukládám do databáze...' : 'Uložit produkt'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
