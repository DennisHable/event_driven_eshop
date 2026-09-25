<?php

namespace App\Service;

use App\Entity\Product;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

class AdminService {

    public function __construct(private readonly EntityManagerInterface $entityManager) {}


    public function addNewProduct(array $data, ?User $user): array {
        if(!$user || !in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return ['success' => false, 'error' => 'Přidání produktu může provádět jen přihlášený ADMIN.', 'code' => 400];
        }

        // musí být přítomny: "name, price, stock, category, description"
        if(!isset($data['name']) || !isset($data['price']) || !isset($data['stock']) || !isset($data['category']) || !isset($data['description'])) { // pokud v poli $data neexistují ty klíče nebo existují ale jsou null
            return ['success' => false, 'error' => 'Chybějící povinné parametry produktu.', 'code' => 400];
        }

        $product = new Product();
        $product->setName($data['name'])
            ->setPrice($data['price'])
            ->setStock($data['stock'])
            ->setCategory($data['category'])
            ->setDescription($data['description']);

        // $productRepo = $this->entityManager->getRepository(Product::class);

        $this->entityManager->persist($product); // předání instance Produktu do Doctrine ORM
        $this->entityManager->flush(); // zapsání do DB

        return ['success' => true, 'productId' => $product->getId(), 'code' => 201];
    }

    public function editProduct(array $data, int $id, ?User $user): array {
        if(!$user || !in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return ['success' => false, 'error' => 'Editaci produktu může provádět jen přihlášený ADMIN.', 'code' => 400];
        }

        $product = $this->entityManager->getRepository(Product::class)->find($id); // najít produkt dle id v tabulce přísušející třídě Product
        if (!$product) {
            return ['success' => false, 'error' => 'Produkt neexistuje.', 'code' => 404];
        }

        if(isset($data['name'])) {
            $product->setName($data['name']);
        }

        if(isset($data['price'])) {
            $product->setPrice($data['price']);
        }

        if(isset($data['stock'])) {
            $product->setStock($data['stock']);
        }

        if(isset($data['category'])) {
            $product->setCategory($data['category']);
        }

        if(isset($data['description'])) {
            $product->setDescription($data['description']);
        }

        $this->entityManager->flush();
        return ['success' => true, 'productId' => $product->getId(), 'code' => 200];
    }


    public function deleteProduct(int $id, ?User $user): array {
        if(!$user || !in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return ['success' => false, 'error' => 'Editaci produktu může provádět jen přihlášený ADMIN.', 'code' => 400];
        }

        $product = $this->entityManager->getRepository(Product::class)->find($id);

        if (!$product) {
            return ['success' => false, 'error' => 'Produkt neexistuje.', 'code' => 404];
        }

        // odstranění objekt z paměti a flush() provede SQL dotaz "DELETE FROM products WHERE id = X"
        $this->entityManager->remove($product);
        $this->entityManager->flush();

        return ['success' => true, 'productId' => $product->getId(), 'code' => 200];
    }

}
