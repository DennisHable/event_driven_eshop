import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function PaymentPage() {
    const [cardNumber, setCardNumber] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ error: '', success: false });

    const { orderId } = useParams(); // parametr (id produktu) z URL
    const navigate = useNavigate();

    const handlePay = (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ error: '', success: false });

        fetch('/api/payment/webhook', { // platba kartou (zjednodušeně)
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, cardNumber, pin })
        })
            .then(async (res) => {
                const data = await res.json(); // převod na json je asychnonní, může to trvat, tak se bude čekat (resp. až to bude, tak se bude pokračovat)
                if (!res.ok) throw new Error(data.error || 'Platba byla bankou zamítnuta.');

                setStatus({ error: '', success: true });
                setLoading(false);

                // po úspěšné platbě uživatele se za 3 sekundy vrátíme zpět do e-shopu na stránku jeho profilu
                setTimeout(() => {
                    navigate('/profile');
                }, 3000);
            })
            .catch((err) => {
                setStatus({ error: err.message, success: false });
                setLoading(false);
            });
    };

    if (status.success) {
        return (
            <div className="max-w-md mx-auto mt-16 text-center bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-4">
                <CheckCircle size={48} className="text-emerald-500 mx-auto animate-bounce" />
                <h2 className="text-2xl font-bold text-white">Platba schválena!</h2>
                <p className="text-zinc-400 text-sm">
                    Banka úspěšně autorizovala transakci. Přesměrovávám vás zpět do e-shopu, do vaší historie objednávek...
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-12 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 pb-3 border-b border-zinc-800">
                <CreditCard className="text-emerald-400" size={24} />
                <h2 className="text-lg font-bold text-white">Zabezpečená platební brána banky</h2>
            </div>

            {status.error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium flex items-center space-x-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{status.error}</span>
                </div>
            )}

            <form onSubmit={handlePay} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Číslo platební karty</label>
                    <input
                        type="text"
                        required
                        placeholder="1111-2222-3333-4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">PIN kód karty</label>
                    <div className="relative">
                        <input
                            type="password"
                            required
                            maxLength={4}
                            placeholder="••••"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
                        />
                        <Lock size={16} className="absolute left-3 top-3 text-zinc-700" />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center shadow-lg cursor-pointer"
                    >
                        <span>{loading ? 'Ověřuji zůstatek na účtu...' : 'Potvrdit platbu'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
