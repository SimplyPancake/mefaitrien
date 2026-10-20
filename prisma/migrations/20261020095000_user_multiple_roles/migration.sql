CREATE TABLE "UserRole" (
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "role"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "UserRole" ("userId", "role")
SELECT "id", "role" FROM "User";

ALTER TABLE "User" DROP COLUMN "role";
