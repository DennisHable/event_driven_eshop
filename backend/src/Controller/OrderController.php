<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Service\OrderService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Messenger\Exception\ExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;

class OrderController extends AbstractController
{
    public function __construct(
        private readonly OrderService $orderService
    ) {}

    /**
     * Vytvoření objednávky pouze pro přihlášené uživatele
     * @throws ExceptionInterface
     */
    #[Route('/api/orders', name: 'api_order_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Pro vytvoření objednávky se musíte přihlásit'], 401);
        }

        $data = json_decode($request->getContent(), true);
        $result = $this->orderService->createOrder($user, $data['items'] ?? []); // pokud 'items' v $data není vrací se prázdné pole

        if (!$result['success']) {
            return new JsonResponse(['error' => $result['error']], $result['code']);
        }

        return new JsonResponse([
            'success' => 'Objednávka byla úspěšně přijata ke zpracování',
            'orderId' => $result['orderId']
        ], $result['code']);
    }

    /**
     * Historie všech objednávek pro aktuálního uživatele.
     */
    #[Route('/api/orders/history', name: 'api_order_history', methods: ['GET'])]
    public function history(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'Pro zobrazení historie se musíte přihlásit'], 401);
        }

        $formattedOrders = $this->orderService->getOrderHistory($user);

        return new JsonResponse($formattedOrders);
    }

    /**
     * Simulace platby kartou
     * @throws ExceptionInterface
     */
    #[Route('/api/payment/webhook', name: 'api_payment_webhook', methods: ['POST'])]
    public function paymentWebhook(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!$data || !isset($data['orderId']) || !isset($data['cardNumber']) || !isset($data['pin'])) { // pokud je $data null, false nebo prázdný; pokud v polid $data neexistují ty klíče nebo existují ale jsou null
            return new JsonResponse(['error' => 'Chybějící platební údaje'], 400);
        }

        $result = $this->orderService->processPayment(
            (int)$data['orderId'],
            $data['cardNumber'],
            $data['pin']
        );

        if (!$result['success']) {
            return new JsonResponse(['error' => $result['error']], $result['code']);
        }

        return new JsonResponse(['success' => 'Platba byla bankou úspěšně schválena.']);
    }

}
