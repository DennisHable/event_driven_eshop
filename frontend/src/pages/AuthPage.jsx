import React, { useState } from 'react';
import { User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true); // true = login, false = registrace
    const [username, setUsername] = useState(''); // uživ. jméno zadané ve formuláři
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // zpráva chyby ze serveru
    const [success, setSuccess] = useState(''); // zpráva o úspěchu registrace/loginu

    const { checkAuthStatus } = useAuth();
    const navigate = useNavigate();

    const handleAuthSubmit = (e) => {
        e.preventDefault(); // odeslání formuláře by způsobilo reload stránky; preventDefault() to zakáže
        setError('');
        setSuccess('');

        if (isLogin) {
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, // pro symfony firewall; že se jedná o strukturovaný JSON data
                body: JSON.stringify({ username, password }) // objekt serializuje do text. řetězce pro poslání po síti
            })
                .then(res => {
                    if (!res.ok) throw new Error('Nesprávné uživatelské jméno nebo heslo');
                    return res.json();
                })
                .then(data => {
                    setSuccess('Přihlášení proběhlo úspěšně! Přesměrovávám...');

                    // zkontrolujeme cookie a načteme uživatele do kontextu
                    checkAuthStatus();

                    // přesměrování na hlavní stranu bez reloadu prohlížeče (SPA)
                    setTimeout(() => {
                        navigate('/');
                    }, 1000); // s timeoutem aby si uživatel mohl přečíst tu zprávu...
                })
                .catch(err => setError(err.message));

        } else {
            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            })
                .then(res => res.json() // promise na přečtení těla odpovědi
                    .then(data => ({ status: res.status, data })))// přístup ke statusu i k datům (vytvoří se nový objekt)
                .then(({ status, data }) => { // ten objekt se předá do dalšího then
                    if (status !== 201) throw new Error(data.error || 'Registrace selhala');
                    setSuccess('Registrace byla úspěšná! Nyní se můžete přihlásit.');
                    setIsLogin(true); // přepneme uživatele na login form
                })
                .catch(err => setError(err.message));
        }
    };

    return (
        <div className="max-w-md w-full mx-auto pt-12">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">

                {/* Záložky pro přepínání */}
                <div className="flex border-b border-zinc-800 bg-zinc-950">
                    <button
                        onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                        className={`flex-1 py-4 text-center text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-2 ${
                            isLogin ? 'text-emerald-400 border-b-2 border-emerald-500 bg-zinc-900/40' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <LogIn size={16} />
                        <span>Přihlášení</span>
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                        className={`flex-1 py-4 text-center text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-2 ${
                            !isLogin ? 'text-emerald-400 border-b-2 border-emerald-500 bg-zinc-900/40' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <UserPlus size={16} />
                        <span>Registrace</span>
                    </button>
                </div>

                {/* formulář */}
                <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        {isLogin ? 'Vítáme vás zpět' : 'Vytvořte si nový účet'}
                    </h2>

                    {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium">{error}</div>}
                    {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">{success}</div>}

                    {/* uživatelské jméno */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Uživatelské jméno</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="Např. jan_novak"
                            />
                            <User size={16} className="absolute left-3 top-2.5 text-zinc-600" />
                        </div>
                    </div>

                    {/* e-mail (pouze při registraci) */}
                    {!isLogin && (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">E-mailová adresa</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="jan.novak@seznam.cz"
                                />
                                <Mail size={16} className="absolute left-3 top-2.5 text-zinc-600" />
                            </div>
                        </div>
                    )}

                    {/* heslo */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Heslo</label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="••••••••"
                            />
                            <Lock size={16} className="absolute left-3 top-2.5 text-zinc-600" />
                        </div>
                    </div>

                    {/* tlačítko pro odeslání */}
                    <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/5 cursor-pointer pt-3 font-semibold"
                    >
                        {isLogin ? 'Přihlásit se' : 'Zaregistrovat se'}
                    </button>
                </form>

            </div>
        </div>
    );
}
