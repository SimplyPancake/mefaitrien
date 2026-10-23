/*
  Warnings:

  - You are about to drop the `WashingRegistrationUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `washUserOneId` to the `WashingRegistration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `washUserTwoId` to the `WashingRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `WashingRegistrationUser` DROP FOREIGN KEY `WashingRegistrationUser_userId_fkey`;

-- DropForeignKey
ALTER TABLE `WashingRegistrationUser` DROP FOREIGN KEY `WashingRegistrationUser_washingRegistrationId_fkey`;

-- AlterTable
ALTER TABLE `WashingRegistration` ADD COLUMN `washUserOneId` INTEGER NOT NULL,
    ADD COLUMN `washUserTwoId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `WashingRegistrationUser`;

-- CreateTable
CREATE TABLE `WashingRegistrationEatUser` (
    `amountEat` INTEGER NOT NULL DEFAULT 1,
    `userId` INTEGER NOT NULL,
    `washingRegistrationId` INTEGER NOT NULL,

    PRIMARY KEY (`userId`, `washingRegistrationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WashingRegistration` ADD CONSTRAINT `WashingRegistration_washUserOneId_fkey` FOREIGN KEY (`washUserOneId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WashingRegistration` ADD CONSTRAINT `WashingRegistration_washUserTwoId_fkey` FOREIGN KEY (`washUserTwoId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WashingRegistrationEatUser` ADD CONSTRAINT `WashingRegistrationEatUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WashingRegistrationEatUser` ADD CONSTRAINT `WashingRegistrationEatUser_washingRegistrationId_fkey` FOREIGN KEY (`washingRegistrationId`) REFERENCES `WashingRegistration`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
