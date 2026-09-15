<?php

namespace App\Message;

/**
 * Po vytvoření objednávky; do asynchonní fronty se vloží pouze malý objekt s id objednávky;
 * Worker to pak zpracuje mimo HTTP požadavek na pozadí serveru.
 */
class OrderCreatedMessage { // DTO
    public function __construct(private int $orderId) {}
    public function getOrderId(): int {
        return $this->orderId;
    }
}
