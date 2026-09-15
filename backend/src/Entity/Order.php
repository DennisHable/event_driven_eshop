<?php

declare(strict_types=1);

namespace App\Entity;

use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'orders')]
class Order
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    // vazba na přihlášeného uživatele
    #[ORM\ManyToOne(targetEntity: User::class)] # mnoho objednávek může patřit jednomu uživ.; v DB vznikne sloupec user_id (cizí klíč)
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $totalPrice; // součet cen za všechny položky

    #[ORM\Column(type: 'string', length: 50)]
    private string $status = 'PENDING'; // výchozí stav po odeslání/vytvoření objednávky

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    // kolekce položek objednávky (jedna objednávka může mít mnoho položek proto OneToMany)
    #[ORM\OneToMany(targetEntity: OrderItem::class, mappedBy: 'order', cascade: ['persist', 'remove'])] # třída na kterou se to mapuje, co bude v té kolekci; mappedBy je název atributu (vazba) v té třídě na kterou se mapuje; co se bude dít při smazání
    private Collection $items;

    public function __construct()
    {
        $this->items = new ArrayCollection();
        $this->createdAt = new DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getUser(): User { return $this->user; }
    public function setUser(User $user): self { $this->user = $user; return $this; }

    public function getTotalPrice(): string { return $this->totalPrice; }
    public function setTotalPrice(string $price): self { $this->totalPrice = $price; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): self { $this->status = $status; return $this; }

    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }

    /**
     * @return Collection<int, OrderItem>
     */
    public function getItems(): Collection { return $this->items; }

    public function addItem(OrderItem $item): self
    {
        if (!$this->items->contains($item)) {
            $this->items->add($item);
            $item->setOrder($this); // obousměrná relace; objednávky má položky a položky náleží objednávce
        }
        return $this;
    }
}
