<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Product;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Product>
 */
class ProductRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Product::class); // repo svázáno s tabulkou mapovanou přes třídu Product (tj. tabulka products); from si to odvodí tedy samo
    }


    /**
     * Vyhledá filtrované produkty s podporou stránkování
     * @param int $page aktuální index stránky
     * @param int $limit počet prvků na stránku
     */
    public function findWithFilters(int $page, int $limit, ?string $search, ?string $category, ?float $minPrice, ?float $maxPrice): array
    {
        // 'p' je alias pro tabulku produktů (podobně jako "SELECT p FROM products p")
        $qb = $this->createQueryBuilder('p');

        // pokud uživatel zadal text pro vyhledávání; vyhledáváme pomocí LIKE (case-insensitive)
        if ($search !== null && $search !== '') {
            $qb->andWhere('LOWER(p.name) LIKE :search') // podmínka
                ->setParameter('search', '%' . mb_strtolower($search) . '%'); // libovolné znaky před a za textem, který zadal user (převedeno na  malá písmena)
        }

        // pokud uživatel vybral kategorii
        if ($category !== null && $category !== '') {
            $qb->andWhere('p.category = :category')
                ->setParameter('category', $category); // prevence proti SQL Injection; Doctrine hodnotu bezpečně ošetří (escape)
        }

        // filtry podle ceny; postgres dělá převod typů automaticky
        if ($minPrice !== null) {
            $qb->andWhere('p.price >= :minPrice')
                ->setParameter('minPrice', $minPrice);
        }
        if ($maxPrice !== null) {
            $qb->andWhere('p.price <= :maxPrice')
                ->setParameter('maxPrice', $maxPrice);
        }

        // určení offsetu (kolik řádků v tabulce přeskočit)
        $offset = ($page - 1) * $limit;
        $qb->setFirstResult($offset) // kde se bude začínat
            ->setMaxResults($limit) // kolik prvků
            ->orderBy('p.id', 'ASC'); // seřadit vzestupně

        return $qb->getQuery()->getResult(); // build a spuštění dotazu
    }


    /**
     * Spočítá celkový počet produktů pro daný filtr (nutné pro výpočet počtu stránek na frontendu)
     */
    public function countWithFilters(?string $search, ?string $category, ?float $minPrice, ?float $maxPrice): int
    {
        $qb = $this->createQueryBuilder('p')
            ->select('COUNT(p.id)'); // pouze počet záznamů

        if ($search !== null && $search !== '') {
            $qb->andWhere('LOWER(p.name) LIKE :search')
                ->setParameter('search', '%' . mb_strtolower($search) . '%');
        }

        if ($minPrice !== null) {
            $qb->andWhere('p.price >= :minPrice')
                ->setParameter('minPrice', $minPrice);
        }
        if ($maxPrice !== null) {
            $qb->andWhere('p.price <= :maxPrice')
                ->setParameter('maxPrice', $maxPrice);
        }

        if ($category !== null && $category !== '') {
            $qb->andWhere('p.category = :category')
                ->setParameter('category', $category);
        }

        return (int)$qb->getQuery()->getSingleScalarResult(); // vrací se jen počet prvků
    }


    /**
     * @return float|null maximální cena ze všech produktů; null pokud je db prázdná
     */
    public function getMaxPrice() : ?float
    {
        $maxPrice = $this->createQueryBuilder('p') // alias pro tabulku produktů
            ->select('MAX(p.price)') // chceme maximální cenu
            ->getQuery()
            ->getSingleScalarResult();

        if(isset($maxPrice)) return (float)$maxPrice;
        return null;
    }
}
