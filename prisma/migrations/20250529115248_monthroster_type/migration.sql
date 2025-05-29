-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CookingGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'aaaaaa',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL
);
INSERT INTO "new_CookingGroup" ("createdAt", "id", "modifiedAt", "name") SELECT "createdAt", "id", "modifiedAt", "name" FROM "CookingGroup";
DROP TABLE "CookingGroup";
ALTER TABLE "new_CookingGroup" RENAME TO "CookingGroup";
CREATE UNIQUE INDEX "CookingGroup_name_key" ON "CookingGroup"("name");
CREATE TABLE "new_MonthRoster" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CANFILLIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MonthRoster" ("createdAt", "id", "month", "updatedAt", "year") SELECT "createdAt", "id", "month", "updatedAt", "year" FROM "MonthRoster";
DROP TABLE "MonthRoster";
ALTER TABLE "new_MonthRoster" RENAME TO "MonthRoster";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
