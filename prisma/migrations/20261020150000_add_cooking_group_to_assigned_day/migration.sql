CREATE TABLE "new_AssignedDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" INTEGER NOT NULL,
    "cookingGroupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "monthRosterId" INTEGER NOT NULL,
    CONSTRAINT "AssignedDay_cookingGroupId_fkey" FOREIGN KEY ("cookingGroupId") REFERENCES "CookingGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssignedDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssignedDay_monthRosterId_fkey" FOREIGN KEY ("monthRosterId") REFERENCES "MonthRoster" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_AssignedDay" ("id", "day", "cookingGroupId", "userId", "monthRosterId")
SELECT "AssignedDay"."id", "AssignedDay"."day", "User"."cookingGroupId", "AssignedDay"."userId", "AssignedDay"."monthRosterId"
FROM "AssignedDay"
INNER JOIN "User" ON "User"."id" = "AssignedDay"."userId"
WHERE "User"."cookingGroupId" IS NOT NULL;

DROP TABLE "AssignedDay";
ALTER TABLE "new_AssignedDay" RENAME TO "AssignedDay";
