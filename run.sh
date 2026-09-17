#!/bin/bash

ACTION=$1

if [ "$ACTION" == "stop" ]; then
    echo "Zastavuji a vypínám všechny Docker kontejnery..."
    docker compose down
    echo "Kontejnery byly bezpečně vypnuty."
    exit 0
fi

if [ "$ACTION" == "del" ]; then
    echo "Zastavuji a vypínám všechny Docker kontejnery a mažu virtuální disky kontejnerů..."
    docker compose down -v
    echo "Kontejnery byly bezpečně vypnuty a virtuální disky smazány."
    exit 0
fi

if [ "$ACTION" != "dev" ] && [ "$ACTION" != "prod" ]; then
    echo "Chyba: Neplatný parametr! Použití:"
    echo "  ./run.sh dev   -> Spustí vývojový režim"
    echo "  ./run.sh prod  -> Spustí čistý produkční režim přes PHP-FPM"
    echo "  ./run.sh stop  -> Vypne celý systém"
    echo "  ./run.sh del  -> Vypne celý systém A SMAŽE VIRTUÁLNÍ DISKY!"
    exit 1
fi

echo "Spouštím e-shop v režimu: $ACTION"

# nastartujeme kontejnery, aby v nich bylo připravené PHP s BCMath
echo "Startuji síť a Docker kontejnery..."
docker compose up -d --build

if [ "$ACTION" == "dev" ]; then
    # dev režim
     echo "Nastavuji PHP-FPM do režimu VÝVOJE (dev)..."
     docker exec -it eshop_backend sh -c "echo 'env[APP_ENV] = dev' >> /usr/local/etc/php-fpm.d/zz-docker.conf"
     docker restart eshop_backend

    echo "Instaluji vývojové závislosti uvnitř kontejneru..."
    docker exec -it eshop_backend composer install

#    echo "Spouštím doplňkový vývojový PHP server pro port 8000..."
#    docker exec -d eshop_backend php -S 0.0.0.0:8000 -t public

    echo "Inicializuji databázové migrace a seeduji data..."
    docker exec -it eshop_backend php bin/console doctrine:migrations:migrate --no-interaction
    # docker exec -it eshop_backend php bin/console doctrine:fixtures:load --no-interaction

    echo "Spouštím asynchronní Messenger worker..."
    docker exec -d eshop_backend php bin/console messenger:consume async

    echo "Vývojové prostředí připraveno na http://localhost "

else
    # produkční režim

    echo "Nastavuji PHP-FPM do režimu PRODUKCE (prod)..."
    docker exec -it eshop_backend sh -c "echo 'env[APP_ENV] = prod' >> /usr/local/etc/php-fpm.d/zz-docker.conf"
    docker restart eshop_backend

    echo "Sestavuji produkční statický build React frontendu..."
    docker run --rm -v $(pwd)/../frontend:/app -w /app node:20-alpine sh -c "npm install && npm run build"

    echo "Instaluji produkční PHP závislosti přímo v kontejneru..."
    # docker exec -it eshop_backend composer install --no-dev --optimize-autoloader
    docker exec -it eshop_backend sh -c "export APP_ENV=prod && composer install --no-dev --optimize-autoloader"


    echo "Optimalizuji Symfony cache pro produkci..."
    docker exec eshop_backend php bin/console cache:clear --env=prod
    docker exec eshop_backend php bin/console doctrine:migrations:migrate --no-interaction --env=prod

    echo "Spouštím produkční asynchronní worker na pozadí..."
    docker exec -d eshop_backend php bin/console messenger:consume async --env=prod

    echo "Produkční verze přes PHP-FPM úspěšně naskočila na http://localhost"
fi
