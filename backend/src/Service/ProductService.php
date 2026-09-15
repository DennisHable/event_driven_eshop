<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Product;
use App\Repository\ProductRepository;
use Doctrine\ORM\EntityManagerInterface;

class ProductService
{
    public function __construct(
        private readonly ProductRepository $productRepository
    ) {}

    /**
     * @return array Pole všech produktů v DB
     */
    public function getAllProducts(): array
    {
        // findAll() je vestavěná metoda Doctrine, vrátí pole objektů typu Product
        return $this->productRepository->findAll();
    }


    /**
     * @param int $page index aktuální stránky
     * @param int $limit počet prvků na stránku
     * @param string|null $search vyhledávací dotaz od uživatele; null pokud není nastavena
     * @param string|null $category kategorie od uživatele; null pokud není nastavena
     * @param float|null $minPrice minimální cena; null pokud není nastavena
     * @param float|null $maxPrice maximální cena; null pokud není nastavena
     * @return array pole produktů
     */
    public function getProductsPaginated(int $page, int $limit, ?string $search, ?string $category, ?float $minPrice, ?float $maxPrice): array
    {
        $products = $this->productRepository->findWithFilters($page, $limit, $search, $category, $minPrice, $maxPrice);
        $totalItems = $this->productRepository->countWithFilters($search, $category, $minPrice, $maxPrice);

        // vypočítáme celkový počet stránek (zaokrouhleno nahoru)
        $totalPages = (int) ceil($totalItems / $limit);

        return [
            'items' => $products, // pole vyfitrovaných produktů
            'meta' => [ // metadata
                'currentPage' => $page, // index aktuální strany
                'totalPages' => $totalPages, // celkový počet stran
                'totalItems' => $totalItems, // celkový počet položek
                'limit' => $limit // počet položek na stránku; nenačítá vše najednou, načítá se to po stránkách
            ]
        ];
    }

    /**
     * @param int $id id produktu
     * @return Product|null pokud existuje tak ho vrátí jinak null
     */
    public function getProductById(int $id): ?Product
    {
        return $this->productRepository->find($id);
    }

    /**
     * @return float|null maximální cena ze všech produktů; null pokud je db prázdná
     */
    public function getMaxPrice() : ?float
    {
        return $this->productRepository->getMaxPrice();
    }
}
