-- AlterTable
ALTER TABLE `User` ADD COLUMN `washingpointsBase` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `WashingPenalty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reason` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WashingRegistration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cookingGroupId` INTEGER NOT NULL,
    `assignedDayId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WashingRegistrationUser` (
    `userId` INTEGER NOT NULL,
    `washingRegistrationId` INTEGER NOT NULL,

    PRIMARY KEY (`userId`, `washingRegistrationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WashingPenalty` ADD CONSTRAINT `WashingPenalty_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WashingRegistration` ADD CONSTRAINT `WashingRegistration_cookingGroupId_fkey` FOREIGN KEY (`cookingGroupId`) REFERENCES `CookingGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WashingRegistration` ADD CONSTRAINT `WashingRegistration_assignedDayId_fkey` FOREIGN KEY (`assignedDayId`) REFERENCES `AssignedDay`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WashingRegistrationUser` ADD CONSTRAINT `WashingRegistrationUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WashingRegistrationUser` ADD CONSTRAINT `WashingRegistrationUser_washingRegistrationId_fkey` FOREIGN KEY (`washingRegistrationId`) REFERENCES `WashingRegistration`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
