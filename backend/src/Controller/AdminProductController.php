<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Service\AdminService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class AdminProductController extends AbstractController {

    public function __construct(private readonly AdminService $adminService) {}

    #[Route('/api/admin/product/add', name: 'admin_product_add', methods: ['POST'])]
    public function addNewProduct(Request $request): JsonResponse {
        /** @var User|null $user */
        $user = $this->getUser(); // vrací objekt aktuálně přihlášeného uživatele (server najde session na serveru dle PHPSESSID a najde v ní security token uživatele); pokud není přiglášen => null; metoda je z AbstractController

        $data = json_decode($request->getContent(), true);

        $result = $this->adminService->addNewProduct($data ?? [], $user);

        if (!$result['success']) {
            return new JsonResponse(['error' => $result['error']], $result['code']);
        }

        return new JsonResponse(['success' => 'Produkt byl úspěšně přidán.'], $result['code']);
    }


    #[Route('/api/admin/product/edit/{id}', name: 'admin_product_edit', methods: ['PUT'])] # PUT = více zavolání nic dále nezmění (lze zavolat vícekrát a efekt bude jako kdyby se to volalo jen jednou) narozdíl od POST, kde se dle specifikace očekává přidávání
    public function editProduct(Request $request, int $id): JsonResponse {
        /** @var User|null $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);

        $result = $this->adminService->editProduct($data, $id, $user);

        if (!$result['success']) {
            return new JsonResponse(['error' => $result['error']], $result['code']);
        }

        return new JsonResponse(['success' => 'Produkt byl úspěšně upraven.'], $result['code']);
    }


    #[Route('/api/admin/product/delete/{id}', name: 'api_admin_product_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse {
        /** @var User|null $user */
        $user = $this->getUser();

        $result = $this->adminService->deleteProduct($id, $user);

        if (!$result['success']) {
            return new JsonResponse(['error' => $result['error']], $result['code']);
        }

        return new JsonResponse(['success' => 'Produkt byl úspěšně smazán z katalogu']);
    }
}
