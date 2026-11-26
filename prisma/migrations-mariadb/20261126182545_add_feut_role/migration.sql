-- AlterTable
ALTER TABLE `UserRole` DROP PRIMARY KEY,
    MODIFY `role` ENUM('USER', 'COOKING', 'ADMIN', 'FEUT') NOT NULL,
    ADD PRIMARY KEY (`userId`, `role`);
