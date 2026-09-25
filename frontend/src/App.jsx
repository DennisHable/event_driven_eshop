import React from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import CartProvider from './context/CartContext';
import Navbar from './components/Navbar';
import MainPage from './pages/MainPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import AuthProvider from "./context/AuthContext";
import PaymentPage from './pages/PaymentPage';
import AdminProductFormPage from './pages/AdminProductFormPage';

export default function App() {
    return ( // závoky kvůli strukturování JSX; Vite vezme JSX a přeloží (transpilace) ho do JS (React/Prohlížeč ty funkce zavolá, postaví v RAM Virutal DOM; pomocí nativních metod prohlížeče vygeneruje HTML - při rerenderu úprava jen toho co se změnilo)
        <BrowserRouter> {/* v každý komponentě bude možné přepínat stránky (měnit adresu); sledování URL adresy v prohlížeči pomocí HTML5 history api, zachytává kliknutí na odkazy */}
            <AuthProvider> {/* práce s přihlášený uživatelem */}
                <CartProvider> {/* přístup ke košíku všem položkám uvnitř tagu */}
                    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
                        <Navbar/>
                        <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                            <Routes> {/*switch-case logika; jaká komponenta se má vykreslit v závislosti na tom jaká adresa je v adresním řádku */}
                                <Route path="/" element={<MainPage/>}/>
                                <Route path="/auth" element={<AuthPage/>}/>
                                <Route path="/product/:id" element={<ProductDetailPage/>}/> {/* :id - dvojtečka je wildcard/proměnná, jakékoliv číslo/text na tomto místě jde do této routy*/}
                                <Route path="/cart" element={<CartPage/>}/>
                                <Route path="/profile" element={<ProfilePage/>}/>
                                <Route path="/payment/:orderId" element={<PaymentPage />} />
                                <Route path="/admin/product/new" element={<AdminProductFormPage />} />
                                <Route path="/admin/product/edit/:id" element={<AdminProductFormPage />} />
                            </Routes>
                        </main>
                    </div>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
