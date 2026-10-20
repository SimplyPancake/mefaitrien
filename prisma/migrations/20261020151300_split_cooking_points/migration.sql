ALTER TABLE "User" RENAME COLUMN "cookingpoints" TO "cookingpointsBase";

UPDATE "User"
SET "cookingpointsBase" = "cookingpointsBase" - (
    SELECT COUNT(*)
    FROM "AssignedDay"
    WHERE "AssignedDay"."userId" = "User"."id"
);
