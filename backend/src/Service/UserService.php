<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserService
{
    // DI manažera DB a hashera hesel
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher
    ) {}


    /**
     * zpracování registrace uživatele
     * @param array $data asociativní pole s datama od uživatele
     */
    public function registerUser(array $data): array
    {
        // kontrola povinných polí pro registraci v JSON datech
        if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
            return ['success' => false, 'error' => 'Chybějící povinné údaje', 'code' => 400];
        }

        // vrací repo pro třídu/entitu User
        $userRepo = $this->entityManager->getRepository(User::class);

        // kontrola unikátnosti uživatelského jména
        if ($userRepo->findOneBy(['username' => $data['username']])) {
            return ['success' => false, 'error' => 'Uživatelské jméno je již obsazené', 'code' => 400];
        }

        // kontrola unikátnosti e-mailu
        if ($userRepo->findOneBy(['email' => $data['email']])) {
            return ['success' => false, 'error' => 'Tento e-mail je již registrován', 'code' => 400];
        }

        // vytvoření nové instance uživatele a zahashování hesla; entita pro DB
        $user = new User();
        $user->setUsername($data['username']);
        $user->setEmail($data['email']);

        $hashedPassword = $this->passwordHasher->hashPassword($user, $data['password']); // hashování hesla
        $user->setPassword($hashedPassword);
        $user->setRoles(['ROLE_USER']); // automaticky se přiřadí role pouze USER

        $this->entityManager->persist($user); // předání objektu pro Doctrine ORM
        $this->entityManager->flush(); // zapsání do DB

        return ['success' => true, 'code' => 201];
    }
}

