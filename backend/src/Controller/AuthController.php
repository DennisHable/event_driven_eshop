<?php

declare(strict_types=1); // striktní typový systém

namespace App\Controller;

use App\Entity\User;
use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class AuthController extends AbstractController {
    public function __construct(private readonly UserService $userService) {}

    /**
     * Zaregistuje uživatele (201 OK), pokud neexistuje uživatel se stejným username nebo emailem (vrací 400 - Bad Req.)
     * @param Request $request To co přišlo od klienta, URL, HTTP metoda, cookies, tělo požadavku
     */
    #[Route('/api/register', name: 'api_register', methods: ['POST'])] # URL adresa; alias dané URL adresy v rámci celé appky; HTTP metoda
    public function register(Request $request): JsonResponse     {
        $data = json_decode($request->getContent(), true); // vezme raw řetězec z těla HTTP požadavku a převede ho z JSONu na asociativní pole (druhý param = true)

        $result = $this->userService->registerUser($data ?? []); // pokud proměnná $data existuje a není null, tak použij ji, jinak použij prázdné pole

        if (!$result['success']) { // success je nastaven (existuje) v registerUser vždy na nějakou hodnotu
            return new JsonResponse(['error' => $result['error']], $result['code']); // JsonResponse doplňuje hlavičku "Content-Type: application/json" aby se na data díval ten kdo to volá jako na JSON a ne jako na HTML
        }

        return new JsonResponse(['success' => 'Uživatel byl úspěšně registrován'], $result['code']);
    }


    /**
     * přesměrování z Symfony security po úspěšném logout
     */
    #[Route('/api/logout-success', name: 'api_logout_success', methods: ['GET'])]
    public function logoutSuccess(): JsonResponse
    {
        return new JsonResponse(['success' => 'Odhlášení proběhlo úspěšně']);
    }


    /**
     * spravováné automaticky Symfony firewallem na pozadí; tato metoda se nikdy nespustí, služí pro info o cestě
     * @return JsonResponse
     */
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        return new JsonResponse([]);
    }

    /**
     * Informace o přihlášeném uživateli; 401 (Unauthorized) když není nikdo přihlášen
     */
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        // Symfony automaticky zkontroluje session cookie
        // pokud je uživatel přihlášený (proběhl login), vrátí instanci User; pokud ne, vrátí null
        /** @var User|null $user */
        $user = $this->getUser(); // metodu poskytuje AbstractController

        if (!$user) { // není přihlášen
            return new JsonResponse(['authenticated' => false], 401);
        }

        // vracíme informace o přihlášeném uživateli pro React; heslo (resp. jeho hash se solí) se samozřejmně nevrací...
        return new JsonResponse([
            'authenticated' => true,
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles()
        ]);
    }

}

