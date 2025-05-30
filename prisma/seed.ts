import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let adminuser = await prisma.user.upsert({
    where: { email: "admin@mfr.com" },
    update: {},
    create: {
      email: "admin@mfr.com",
      name: "Admin",
      role: Role.ADMIN,
      passwordHash: "$2a$15$Cakv7l/AAIknVl7knoUarOSJMzKPe2s86zRG6q96iR27GTXXXDHsS",
      username: "admin",
    },
  });

  await prisma.cookingGroup.upsert({
    where: { name: "K1" },
    update: {},
    create: {
      name: "K1",
      color: "#5fba3c",
    },
  });

  let k2 = await prisma.cookingGroup.upsert({
    where: { name: "K2" },
    update: {},
    create: {
      name: "K2",
      color: "#ba3c62",
    },
  });

  await prisma.user.update({
    where: {
      id: adminuser.id,
    },
    data: {
      cookingGroupId: k2.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
