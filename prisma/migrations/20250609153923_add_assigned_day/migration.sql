-- CreateTable
CREATE TABLE "AssignedDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "monthRosterId" INTEGER NOT NULL,
    CONSTRAINT "AssignedDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssignedDay_monthRosterId_fkey" FOREIGN KEY ("monthRosterId") REFERENCES "MonthRoster" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
