import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const AuthContext = createContext(null); // vytvoří instanci; má props Provider (vnitřní komponenta/fce; distubuce atributu value dolů)

export default function AuthProvider({ children }) { // children všechny zanořené JSX komponenty
    const [user, setUser] = useState(null); // stavová proměnná "user" - drží aktuálně přihlášeného uživatele; po volání setteru provádí React rerender komponenty
    const [loading, setLoading] = useState(true); // načítací kolečko, dokud se čeká na odpověď od backendu
    const navigate = useNavigate(); // hook z knihovny routeru; vrací funkci, kterou lze v JS měnit URL adresu, bez reloadu stránky

    // funkce, která umí ověřit, zda uživatel už má aktivní session cookie
    const checkAuthStatus = () => {
        fetch('/api/me') // asynchonní (neblokuje vlákno JS) HTTP GET požadavek; browser přibaluje session cookie
            .then(res => res.ok ? res.json() : null) // server vrátil stav 200 (OK), tak se parsuje jako JSON (opět asynchoronně), jinak null
            .then(data => { // máme data z backendu převedna do JSONu nebo null
                if (data && data.username) { // data existují a obsahují username
                    setUser(data); // přihlášený uživ. se uloží do stavu => rerender (asynchronně)
                } else {
                    setUser(null);
                }
                setLoading(false);
            })
            .catch(() => { // selhání sítě (server je offline); web se bude tvárít, že není nikdo přihlášen a vypneme načítání
                setUser(null);
                setLoading(false);
            });
    };

    useEffect(() => {
        checkAuthStatus();
    }, []); // prázdné pole závislostí = spustí se jen jednou při startu appky (při načtení v prohlížeči; tedy i po F5)

    const logout = () => {
        setUser(null); // smazat usera z mem Reactu
        fetch('/api/logout') // fetch na backend, smaže session na serveru (tj. nepůjde tam přes něj už přistoupit; současně s tím vrací zpět cookie s expirací cookie, tím pak prohlížeč smaže cookie u klienta)
            .then(() => {
                navigate('/auth'); // redirect na login stránku
            });
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout, checkAuthStatus }}> {/* nastavení proměnné AuthContext a jejího "Provider" a "value" nastavíme na funkce/stavy co budou vidět v zanořených komponentách */}
            {children} {/*zde se vykreslí předané zanořené JSX komponenty*/}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext); // najde nejbliží "Provider" a vrátí to jeho "value"
}
