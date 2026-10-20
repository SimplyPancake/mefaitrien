import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { SessionEvent } from "~/types";
import { array, number, object, string } from "yup";
import { Role } from "~/generated/prisma/enums";

let handlerFunc = async (event: SessionEvent) => {
  const { id, name, email, roles, cookingGroupId, username } = event.data;

  const admins = await prisma.user.findMany({
    where: {
      roles: {
        some: { role: "ADMIN" },
      },
    },
  });

  if (admins.length === 1 && admins[0]!.id === id && !roles.includes("ADMIN")) {
    throw createError({ status: 403, statusMessage: "Last admin cannot become regular user" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        name: name,
        username: username,
        email: email,
        roles: {
          deleteMany: {},
          create: roles.map((role: string) => ({ role })),
        },
        cookingGroupId: parseInt(cookingGroupId),
        modifiedAt: new Date(),
      },
    });

    return updatedUser;
  } catch (error) {
    console.error(error);
    throw createError({ status: 500, statusMessage: "Failed to update user" });
  }
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(
    event,
    handlerFunc,
    object({
      id: number().required("User ID is required"),
      name: string().required("Name is required"),
      email: string().email("Invalid email address").required("Email is required"),
      roles: array()
        .of(string().oneOf(Object.values(Role), "Invalid role").required())
        .min(1, "At least one role is required")
        .test("uniqueRoles", "Roles must be unique", (roles) => !roles || new Set(roles).size === roles.length)
        .required("Roles are required"),
      username: string(),
      cookingGroupId: string().nullable(),
    })
  ).handle({
    route: "/api/admin/editUser",
    method: "POST",
    allowType: "ROLE",
    role: ["ADMIN"],
  });
});
