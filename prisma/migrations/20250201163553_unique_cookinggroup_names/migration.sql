/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Availability` table. All the data in the column will be lost.
  - Added the required column `modifiedAt` to the `Availability` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Availability" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" INTEGER NOT NULL,
    "availability" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "monthRosterId" INTEGER NOT NULL,
    CONSTRAINT "Availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Availability_monthRosterId_fkey" FOREIGN KEY ("monthRosterId") REFERENCES "MonthRoster" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Availability" ("availability", "createdAt", "day", "id", "monthRosterId", "userId") SELECT "availability", "createdAt", "day", "id", "monthRosterId", "userId" FROM "Availability";
DROP TABLE "Availability";
ALTER TABLE "new_Availability" RENAME TO "Availability";
CREATE TABLE "new_CookingGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL
);
INSERT INTO "new_CookingGroup" ("createdAt", "id", "modifiedAt", "name") SELECT "createdAt", "id", "modifiedAt", "name" FROM "CookingGroup";
DROP TABLE "CookingGroup";
ALTER TABLE "new_CookingGroup" RENAME TO "CookingGroup";
CREATE UNIQUE INDEX "CookingGroup_name_key" ON "CookingGroup"("name");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "refreshToken" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "cookingGroupId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL,
    CONSTRAINT "User_cookingGroupId_fkey" FOREIGN KEY ("cookingGroupId") REFERENCES "CookingGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("cookingGroupId", "createdAt", "email", "id", "modifiedAt", "name", "passwordHash", "refreshToken", "role", "username") SELECT "cookingGroupId", "createdAt", "email", "id", "modifiedAt", "name", "passwordHash", "refreshToken", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
