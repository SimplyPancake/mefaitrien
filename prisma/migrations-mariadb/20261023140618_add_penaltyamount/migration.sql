/*
  Warnings:

  - A unique constraint covering the columns `[assignedDayId]` on the table `WashingRegistration` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `WashingPenalty` ADD COLUMN `amount` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX `WashingRegistration_assignedDayId_key` ON `WashingRegistration`(`assignedDayId`);
