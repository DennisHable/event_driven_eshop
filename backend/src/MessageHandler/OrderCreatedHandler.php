<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Entity\Order;
use App\Message\OrderCreatedMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
class OrderCreatedHandler
{
    // Symfony udělá DI EntityManagera pro zápis do postgres DB
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    public function __invoke(OrderCreatedMessage $message): void // objekt se dá volat jako metoda; spouští Symfony Messenger na pozadí (dispatch -> serializace do db tabulky -> worker kontroluje tabulku -> dle typu (OrderCreatedMessage) si najde v mapě handler, kterému to pošle ke zpracování, volání __invoke() )
    {
        $orderRepo = $this->entityManager->getRepository(Order::class);
        $order = $orderRepo->find($message->getOrderId());

        // pokud objednávka v DB neexistuje, proces ukončíme
        if (!$order) {
            return;
        }

        // simulace asynchronního zpracování zpomalení na 3sekundy - generování faktury, poslání emailu (SMTP server), ... - operace co nemají vliv na ACID
        sleep(3);


        // TODO faktura/email
    }
}
