<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\BankCard;
use App\Entity\Product;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;
use \Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;


/**
 * Generování testovacích dat
 */
class AppFixtures extends Fixture
{

    public function __construct(private UserPasswordHasherInterface $passwordHasher) {}


    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('cs_CZ');

        // ID fotek pro každou kategorii
        $images = [
            'Elektronika' => ['photo-1542751371-adc38448a05e', 'photo-1587829741301-dc798b83add3', 'photo-1615663245857-ac93bb7c39e7', 'photo-1527443224154-c4a3942d3acf'],
            'Oblečení' => ['photo-1523381210434-271e8be1f52b', 'photo-1551028719-00167b16eac5', 'photo-1562157873-818bc0726f68', 'photo-1539109136881-3be0616acf4b'],
            'Knihy' => ['photo-1544947950-fa07a98d237f', 'photo-1512820790803-83ca734da794', 'photo-1495640388908-05fa85288e61', 'photo-1506880018603-83d5b814b5a6'],
            'Sport' => ['photo-1517838277536-f5f99be501cd', 'photo-1461896836934-ffe607ba8211', 'photo-1541534741688-6078c6bfb5c5', 'photo-1571019613454-1cb2f99b2d8b']
        ];

        $catalogData = [
            'Elektronika' => ['Bezdrátová sluchátka', 'Mechanická herní klávesnice', 'Herní optická myš 16000 DPI', '4K Monitor 27" IPS', 'Powerbanka 20000mAh', 'Chytré sportovní hodinky', 'USB-C Dokovací stanice', 'Webkamera 1080p Streamer'],
            'Oblečení' => ['Bavlněné tričko', 'Sportovní mikina s kapucí', 'Džínová bunda', 'Pánské kalhoty', 'Běžecké tenisky', 'Kožený opasek', 'Teplá pletená šála'],
            'Knihy' => ['Algoritmy - Průvodce', 'Čistý kód v PHP', 'Čistý kód v Javě', 'Návrhové vzory', 'Kybernetika', 'Operační systémy', 'Základy distribuovaných systémů', 'Webový design', 'Průvodce Dockerem'],
            'Sport' => ['Hliníková lahev', 'Nastavitelná činka 20kg', 'Protiskluzová podložka', 'Cestovní batoh 40L', 'Cyklistická přilba', 'Sada odporových gum na cvičení', 'Fotbalový míč']
        ];

        $allProducts = []; // dočasné pole kvůli shuffle
        foreach ($catalogData as $categoryName => $items) {
            foreach ($items as $productName) {
                for ($variant = 1; $variant <= 3; $variant++) { // aby bylo více produktů přidají se edice
                    $product = new Product();
                    $finalName = $variant === 1 ? $productName : $productName . ' (Edice ' . $variant . ')';

                    // náhodné ID obrázku z pole pro danou kategorii
                    $photoId = $faker->randomElement($images[$categoryName]);

                    $product->setName($finalName)
                        ->setDescription('Produkt z kategorie ' . $categoryName . '. ' . $faker->paragraph(2)) # přes Faker se generuje další fiktivní text pro popis
                        ->setPrice((string)$faker->randomFloat(2, 199, 4999)) // náhodná cena
                        ->setCategory($categoryName)
                        ->setStock($faker->numberBetween(0, 35)) // náhodně; počet položek skladem
                        ->setImageUrl($photoId); // ukládá se jen čisté ID fotky

                    $allProducts[] = $product; // přidáme do pole
                }
            }
        }

        // promíchání, aby nebyly seřazené podle kategorií
        shuffle($allProducts);

        foreach ($allProducts as $product) {
            $manager->persist($product); // vezme objekt, který Doctrine potom uloží do DB; jen příprava vložení dělá až flush
        }

        // uživatelé
        $admin = new User();
        $admin->setUsername('admin')
            ->setEmail('admin@eshop.cz')
            ->setPassword($this->passwordHasher->hashPassword($admin, 'admin123')) // uložení zahashovaného hesla
            ->setRoles(['ROLE_ADMIN']);
        $manager->persist($admin);

        $user = new User();
        $user->setUsername('jan_novak')->setEmail('jan.novak@seznam.cz')->
        setPassword($this->passwordHasher->hashPassword($admin, 'user123'))->setRoles(['ROLE_USER']);
        $manager->persist($user);


        // karty
        $card1 = new BankCard();
        $card1->setCardNumber('1111-2222-3333-4444')
            ->setPin('1234')
            ->setBalance('25000.00');
        $manager->persist($card1);

        $card2 = new BankCard();
        $card2->setCardNumber('5555-6666-7777-8888')
            ->setPin('0000')
            ->setBalance('100.00');
        $manager->persist($card2);


        $manager->flush(); # vše co bylo uloženo se teď v transakci zapíše do DB přes sql INSERT
    }
}
