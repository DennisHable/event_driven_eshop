<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Třída pro simulaci platební karty; má unikátní číslo karty;
 * pin (zjednodušeně) a zůstatek; využívá se pro validaci plateb přes webhook
 */
#[ORM\Entity] // ozn. třídy jako databázového modelu, spravovaného Doctrine ORM; říká, že se třída bude ukládat do DB (mapování tabulky v db na třídu v php)
#[ORM\Table(name: 'bank_cards')] // upřesnění názvu tabulky v DB
class BankCard
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 19, unique: true)]
    private string $cardNumber; // formát: 1234-5678-9012-3456

    #[ORM\Column(type: 'string', length: 4)]
    private string $pin;

    #[ORM\Column(type: 'decimal', precision: 12, scale: 2)] // precision = počet cifer v čísle celkem; scale počet číslic za des. čárkou
    private string $balance; // kolik je na kartě peněz; string kvůli přesnosti výpočtů v pohyblivé řádové čárce

    public function getId(): ?int { return $this->id; }
    public function getCardNumber(): string { return $this->cardNumber; }
    public function setCardNumber(string $num): self { $this->cardNumber = $num; return $this; }
    public function getPin(): string { return $this->pin; }
    public function setPin(string $pin): self { $this->pin = $pin; return $this; }
    public function getBalance(): string { return $this->balance; }
    public function setBalance(string $balance): self { $this->balance = $balance; return $this; }
}
