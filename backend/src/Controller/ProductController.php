<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\ProductService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class ProductController extends AbstractController
{
    public function __construct(
        private readonly ProductService $productService
    ) {}

    /*
    #[Route('/api/products', name: 'api_products_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $products = $this->productService->getAllProducts();

        $data = [];
        foreach ($products as $product) {
            $data[] = [
                'id' => $product->getId(),
                'name' => $product->getName(),
                'description' => $product->getDescription(),
                'price' => $product->getPrice(),
                'category' => $product->getCategory(),
                'stock' => $product->getStock(),
                'imageUrl' => $product->getImageUrl(),
            ];
        }

        return new JsonResponse($data);
    }*/


    /**
     * List položek v eshopu vyfiltrovaný dle požadavku
     * @param Request $request Aktuální idx stránky, počet položek na stranu, vyhledávací dotaz, kategorie, min/max cena pro filtraci
     * @return JsonResponse
     */
    #[Route('/api/products', name: 'api_products_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse {
        // parametry z URL dotazu (GET metoda), definice výchozích hodnot (default)
        $page = $request->query->getInt('page', 1); // aktuální stránka
        $limit = $request->query->getInt('limit', 6); // počet položek na stránku
        $search = $request->query->get('search'); // vyhledávací dotaz pro filtrování
        $category = $request->query->get('category'); // kategorie pro filtrování

        $minPrice = $request->query->get('minPrice') !== null && $request->query->get('minPrice') !== ''
            ? (float) $request->query->get('minPrice')
            : null; // pokud byla zadána minPrice pro filtraci

        $maxPrice = $request->query->get('maxPrice') !== null && $request->query->get('maxPrice') !== ''
            ? (float) $request->query->get('maxPrice')
            : null;

        $result = $this->productService->getProductsPaginated($page, $limit, $search, $category, $minPrice, $maxPrice);

        $itemsData = [];
        foreach ($result['items'] as $product) {
            $itemsData[] = [
                'id' => $product->getId(),
                'name' => $product->getName(),
                'description' => $product->getDescription(),
                'price' => $product->getPrice(),
                'category' => $product->getCategory(),
                'stock' => $product->getStock(),
                'imageUrl' => $product->getImageUrl(),
            ];
        }

        return new JsonResponse([
            'products' => $itemsData,
            'meta' => $result['meta']
        ]);
    }

    /**
     * Detailní informace o daném produktu
     * @param int $id Id produktu
     * @return JsonResponse
     */
    #[Route('/api/products/{id}', name: 'api_products_detail', requirements: ['id' => '\d+'], methods: ['GET'])] // "requirements: ['id' => '\d+']" zajištuje, že se vyžaduje číslo v URL; jinak se vůbec nespustí
    public function productDetail(int $id): JsonResponse {
        $product = $this->productService->getProductById($id);

        if(!$product) {
            return new JsonResponse(['error' => 'Product not found'], 404);
        }

        return new JsonResponse([
            'id' => $product->getId(),
            'name' => $product->getName(),
            'description' => $product->getDescription(),
            'price' => $product->getPrice(),
            'category' => $product->getCategory(),
            'stock' => $product->getStock(),
            'imageUrl' => $product->getImageUrl(),
        ]);
    }

    /**
     * Pro filtr ceny na frontendu; zjistíme max. cenu položek v eshopu
     * @return JsonResponse
     */
    #[Route('/api/products/max-price', name: 'api_products_max_price', methods: ['GET'])]
    public function getMaxPrice(): JsonResponse
    {
        $maxPrice = $this->productService->getMaxPrice();
        return new JsonResponse(['maxPrice' => (float)($maxPrice ?? 5000)]);
    }
}
