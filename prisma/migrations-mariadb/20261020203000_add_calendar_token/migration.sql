ALTER TABLE `User` ADD COLUMN `calendarToken` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `User_calendarToken_key` ON `User`(`calendarToken`);
