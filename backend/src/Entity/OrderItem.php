<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'order_items')]
class OrderItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    // propojení zpět na danou objednávku
    #[ORM\ManyToOne(targetEntity: Order::class, inversedBy: 'items')] //mnoho položek může náležet jedné objednávce
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')] // položka nemůže existovat bez objednávky (nullable = false; NOT NULL); Db kaskáda pokud se smaže objednávka smažou se i její položky, kvůli integritním omezením
    private Order $order; // v tabulce bude u této entity cizí klíč ukazující na tu objenávku

    // propojení na produkt; kvůli obrázku, popisu, názvu atd...
    #[ORM\ManyToOne(targetEntity: Product::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Product $product;

    #[ORM\Column(type: 'integer')]
    private int $quantity; # počet kusů této položky

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $priceAtPurchase; # původní cena při nákupu

    public function getId(): ?int { return $this->id; }

    public function getOrder(): Order { return $this->order; }
    public function setOrder(Order $order): self { $this->order = $order; return $this; }

    public function getProduct(): Product { return $this->product; }
    public function setProduct(Product $product): self { $this->product = $product; return $this; }

    public function getQuantity(): int { return $this->quantity; }
    public function setQuantity(int $quantity): self { $this->quantity = $quantity; return $this; }

    public function getPriceAtPurchase(): string { return $this->priceAtPurchase; }
    public function setPriceAtPurchase(string $price): self { $this->priceAtPurchase = $price; return $this; }
}
