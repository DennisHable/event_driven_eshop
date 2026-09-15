<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity]
#[ORM\Table(name: 'users')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 180, unique: true)]
    private string $username;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $email;

    #[ORM\Column(type: 'string', length: 255)]
    private string $password;

    #[ORM\Column(type: 'json')]
    private array $roles = []; // pole bude v DB uloženo jako JSON

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUsername(): string
    {
        return $this->username;
    }

    public function setUsername(string $username): self
    {
        $this->username = $username;
        return $this;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }

    /**
     * nutné kvůli Symfony security; vrací hash hesla z DB, při loginu se ověřuje to oběřuje
     */
    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): self
    {
        $this->password = $password;
        return $this;
    }

    /**
     * Vrátí pole rolí uživatele (Symfony vyžaduje, aby každá začínala na "ROLE_")
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // každý uživatel má aspoň základní roli USER
        if (empty($roles)) {
            $roles[] = 'ROLE_USER';
        }
        return array_unique($roles); // bez duplicit
    }

    public function setRoles(array $roles): self
    {
        $this->roles = $roles;
        return $this;
    }

    /**
     * unikátní indetifikátor uživatele; vyžaduje UserInterface, kvůli Symfony security (login)
     */
    public function getUserIdentifier(): string
    {
        return $this->getUsername();
    }

}
