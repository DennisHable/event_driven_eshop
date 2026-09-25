import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev
// konfig chování vite uvnitř kontejneru; komunikace s vnějškem
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: { // nastavení pro lokální vývojový server
        host: '0.0.0.0',      // naslouchá na všech síťových rozhraních; jinak by s ním nginx nemohl komunikovat
        port: 5173, // port přes který může někdo (nginx) komunikovat
        strictPort: true, // pokud by byl port obsazen, nebude zkoušet jiný a spadne s chybou
        hmr: { // hot module replacement; siť. websocket protokol
            protocol: 'ws', // nezabezpečený WebSocket protokol (ws://); pro https je nutné použít wss
            host: 'localhost', // kam má websocket připojení směřovat
            clientPort: 80,   // donutí prohlížeč komunikovat s websocketem přes port 80 Nginxu; Vite server běží uvnitř Dockeru na portu 5173; bez tohoto řádku by se Firefox pokoušel připojit na localhost:5173, což by selhalo, protože port 5173 není z Dockeru otevřený do hostitele (docker-compose)
            path: '/vite-ws/', // nový endpoint/virtuální složka; požadavky půjdou přes adresu "ws://localhost/vite-ws/" (port 80, přes nginx); dddělení provozu WebSocketu od běžných stránek (nginx může lépe rozpoznat)
        },
    },
})
