<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\BankCard;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Product;
use App\Entity\User;
use App\Message\OrderCreatedMessage;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\OptimisticLockException;
use Symfony\Component\Messenger\Exception\ExceptionInterface;
use Symfony\Component\Messenger\MessageBusInterface;

class OrderService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly MessageBusInterface $messageBus
    ) {}

    /**
     * @throws ExceptionInterface
     */
    public function createOrder(User $user, array $cartItems): array {
        if (empty($cartItems)) { // pokud je prázdné ([], "", 0, null nebo false)
            return ['success' => false, 'error' => 'Košík je prázdný', 'code' => 400];
        }

        $order = new Order();
        $order->setUser($user);

        $totalPrice = '0.00'; // celková cena jako string kvůli přesnosti
        $productRepo = $this->entityManager->getRepository(Product::class);

        foreach ($cartItems as $cartItem) { // pro každý produkt co si uživatel chce objednat
            $product = $productRepo->find($cartItem['id']); // najdeme v DB reálný produkt podle id

            if (!$product) { // kontrola jestli je (ještě) v DB
                return ['success' => false, 'error' => 'Produkt s ID ' . $cartItem['id'] . ' neexistuje', 'code' => 404];
            }

            if ($product->getStock() < $cartItem['quantity']) { // není dost položek tohoto produktu skladem
                return [
                    'success' => false,
                    'error' => sprintf('Nedostatek zboží na skladě pro produkt "%s". Dostupných kusů: %d', $product->getName(), $product->getStock()),
                    'code' => 400
                ];
            }

            $orderItem = new OrderItem(); // 1 položka objednávky
            $orderItem->setProduct($product); // položka objednávky má referenci na ten reálný produkt v DB (skladu)
            $orderItem->setQuantity($cartItem['quantity']);
            $orderItem->setPriceAtPurchase($product->getPrice());

            $order->addItem($orderItem); // přidání reference položky do objednávky (opačná reference se předá v metodě)

            $itemSubtotal = bcmul($product->getPrice(), (string)$cartItem['quantity'], 2); // cena za všechny kusy tohoto produktu
            $totalPrice = bcadd($totalPrice, $itemSubtotal, 2); // cena za všechny položky v objednávce
        }

        $order->setTotalPrice($totalPrice);

        $this->entityManager->persist($order); // připravení SQL dotazů nad DB (insert do orders a order_items)
        $this->entityManager->flush(); // zápis do DB

        // vložení do asynchronní fronty (test.); teď upraveno na kartu (processPayment) - callback
        // $this->messageBus->dispatch(new OrderCreatedMessage($order->getId()));

        return ['success' => true, 'orderId' => $order->getId(), 'code' => 201];
    }

    /**
     * Vrátí historii zaplacených i nezaplacených objednávek daného uživatele.
     */
    public function getOrderHistory(User $user): array
    {
        $orderRepo = $this->entityManager->getRepository(Order::class);
        $orders = $orderRepo->findBy(['user' => $user], ['createdAt' => 'DESC']); // najde všechny objednávky pro tohoto uživatele (v Order třídě je atribut 'user', kam se to přiřadí, id pro dotaz si pak doctrine vytáhne), seřazení sestupně podle data vytvoření

        $formattedOrders = [];
        foreach ($orders as $order) {
            $itemsData = [];
            foreach ($order->getItems() as $item) {
                $itemsData[] = [
                    'productName' => $item->getProduct()->getName(),
                    'quantity' => $item->getQuantity(),
                    'price' => $item->getPriceAtPurchase()
                ];
            }

            $formattedOrders[] = [
                'id' => $order->getId(),
                'totalPrice' => $order->getTotalPrice(),
                'status' => $order->getStatus(),
                'createdAt' => $order->getCreatedAt()->format('d.m.Y H:i'),
                'items' => $itemsData
            ];
        }

        return $formattedOrders;
    }

    /**
     * Platba kartou, odečtení peněz, odečtení položek ze skladu
     * @throws ExceptionInterface
     * @throws OptimisticLockException
     */
    public function processPayment(int $orderId, string $cardNumber, string $pin): array {
        $orderRepo = $this->entityManager->getRepository(Order::class);
        $order = $orderRepo->find($orderId); // najdeme objednávku co chce uživatel zaplatit

        if (!$order) { // pokud z nějakého důvodu neexistuje
            return ['success' => false, 'error' => 'Objednávka neexistuje', 'code' => 404];
        }

        if($order->getStatus() == 'PAID') {
            return ['success' => false, 'error' => 'Objednávka již byla zaplacena', 'code' => 400];
        }

        $bankCardRepo = $this->entityManager->getRepository(BankCard::class);
        $card = $bankCardRepo->findOneBy(['cardNumber' => $cardNumber, 'pin' => $pin]); // najdeme právě jednu kartu podle čísla (je unikátní) a pinu

        if (!$card) {
            return ['success' => false, 'error' => 'Neplatné číslo karty nebo nesprávný PIN kód', 'code' => 400];
        }

        // okamžité zamknutí řádku z kartou v DB; Doctrine si z objektu $card vezme ID a pošle do Postgresu "SELECT ... FROM bank_cards WHERE id = X FOR UPDATE" (lock)
        $this->entityManager->lock($card, LockMode::PESSIMISTIC_WRITE);

        // zkontrolujeme zůstatek na té fiktivní kartě pomocí bccomp (finanční porovnání)
        // vrací -1, pokud je zůstatek menší než cena objednávky
        if (bccomp($card->getBalance(), $order->getTotalPrice(), 2) === -1) {
            $order->setStatus('FAILED');
            $this->entityManager->flush(); // zápis statusu objednávky
            return ['success' => false, 'error' => 'Nedostatečný zůstatek na bankovním účtu', 'code' => 400];
        }

        foreach ($order->getItems() as $item) { // bereme položky objednávky, kontrola jestli jich je všech dost skladem (aby se buď upravilo vše nebo nic)
            $product = $item->getProduct(); // bereme produkt na který ten item reálně odkazuje (obsahuje referenci na ten objekt, který je opravdu uložen v DB products); doctrine dosadí instanci na základě cizího klíče v DB

            // vezme tento produkt a okamžitě ho v DB zamkne pro zápis (postgres řádek pro ostatní procesy zmrazí; dotaz "SELECT ... FOR UPDATE")
            $this->entityManager->lock($product, LockMode::PESSIMISTIC_WRITE);

            if($product->getStock() < $item->getQuantity()) {
                // odemknutí zámků zařídí cyklus HTTP požadavku, na jeho konci se prostě uvolní zámky (proces (požadavek) končí); Doctrine pošle ROLLBACK do DB (lock běží v transakci)
                return ['success' => false, 'error' => 'Nedostatečné množství položek na skladě.', 'code' => 400];
            }
        }

        // projdeme položky objednávky a odečteme kusy ze skladu v DB; díky zámku, pokud jich bylo dost výše, teď jich tam je stejně
        foreach ($order->getItems() as $item) {
            $product = $item->getProduct();

            // nutně je skladem více nebo stejně položek než někdo požaduje v obejdnávce (tedy výsledek je nezáporný)
            $newStock = $product->getStock() - $item->getQuantity();
            $product->setStock($newStock); // aktualizace počtu kusů
        }

        // zůstatek je dostatečný, odečteme peníze z karty
        $newBalance = bcsub($card->getBalance(), $order->getTotalPrice(), 2);
        $card->setBalance($newBalance);

        $order->setStatus('PAID');
        $this->entityManager->flush(); // zápis do DB že je zaplaceno; update početu kusů produktů; provedení změn, COMMIT trasnsakce (a odemknutí zámků)

        // zpráva do fronty pro asynchronní worker - pro potencionálně těžší operace (aby se nedělali v HTTP požadavku) třeba poslání emailu, geneerování faktury, ...
        $this->messageBus->dispatch(new OrderCreatedMessage($order->getId()));

        return ['success' => true];
    }
}
