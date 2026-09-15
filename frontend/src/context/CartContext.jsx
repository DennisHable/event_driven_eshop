import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext(null);

export default function CartProvider({ children }) {
    // držíme v localStorage primárně jen "id, quantity"; zbytek se opět načte ze serveru (hlavně kvůli cenně, která by se mohla změnit)
    const [cartItems, setCartItems] = useState(() => { // anonymní funkce, která se spustí jednou při startu (nebo F5)
        const savedCart = localStorage.getItem('eshop_cart'); // obsah košíku ukládáme v perzistentní text. memory
        return savedCart ? JSON.parse(savedCart) : []; // pokud tam je něco, tak se to převede na JSON a uloží nebo se uloží prázdný pole (košík)
    });

    useEffect(() => {
        localStorage.setItem('eshop_cart', JSON.stringify(cartItems)); // převod z JSONu na text pro uložení
    }, [cartItems]); // když se změní v paměti obsah proměnné cartItems (košíku) - přidání/smazání (prvky neupravujeme, nezpůsobilo by to rerender; JS porovnává ref. v pamětí), tak se to upraví i v localStorage

    const addToCart = (product, quantity) => { // produkt co se přidává; kolik položek se přidává
        setCartItems((prevItems) => { // anonymní funkce, která má v argumentu aktuální ("staré") pole
            const existingItem = prevItems.find((item) => item.id === product.id); // najdeme v košíku jestli tam už ten prvek co chceme vložit je (pak ho uložíme do "existingItem") nebo ne

            if (existingItem) { // existuje
                // vypočítáme nový počet položek
                const potentialNewQuantity = existingItem.quantity + quantity;

                // zaručíme, že počet položek nikdy nepřesáhne fyzický stav skladu (product.stock); pokud by uživatel požadoval (košík + aktuální přidání) víc než je skladem
                const finalQuantity = Math.min(potentialNewQuantity, product.stock);

                return prevItems.map((item) => // map projde staré prvky v košíku a vytvoří pro ně novou instanci pole + nový prvek; prevItems se nemění
                    item.id === product.id ? { ...item, quantity: finalQuantity } : item // je to ta položky, pak se vytvoří nový objekt (zachovají se původní hodnoty akorát se upraví počet položek); kddyž to není ta položka, tak se jen vrátí
                );
            }

            // produkt přidáváme poprvé, vezmou se všechny prvky v původním poli vytvoří se kopie udělá se z nich nové pole spolu s akrutální položkou (prevItems není kopie košíku je to ten obsah; úpravou bysme tam dosadili jen stejnou ref. a k rerenderu by nedošlo)
            return [...prevItems, { id: product.id, quantity, cachedProduct: product }];
        });
    };


    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId)); // najde produkt podle id, vyfiltruje to (zachová jen prvky co mají id různé) a vrací kopii
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        // localStorage.removeItem('eshop_cart');
    };

    const getCartCount = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0); // procházíme pole košíku a sčítáme kusy; začíná od nuly (0 na konci = initVal "total")
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (parseFloat(item.cachedProduct?.price || 0) * item.quantity), 0); // součet ceny všech produktů (kešovaných), pokud není kešovaný, tak se vrací 0 (tj. nepočítá se) ... UNUSED (vždy se to tahá nově z backendu)
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartCount, getCartTotal, setCartItems }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
