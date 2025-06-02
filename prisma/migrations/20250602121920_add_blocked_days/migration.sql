-- CreateTable
CREATE TABLE "BlockedDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" INTEGER NOT NULL,
    "monthRosterId" INTEGER NOT NULL,
    CONSTRAINT "BlockedDay_monthRosterId_fkey" FOREIGN KEY ("monthRosterId") REFERENCES "MonthRoster" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
