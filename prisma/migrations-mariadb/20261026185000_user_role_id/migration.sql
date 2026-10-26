-- Add an auto-incrementing identifier to existing user-role assignments.
-- The unique index preserves the previous composite primary key's semantics.
ALTER TABLE `UserRole`
    DROP PRIMARY KEY,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
    ADD UNIQUE INDEX `UserRole_userId_role_key` (`userId`, `role`);
