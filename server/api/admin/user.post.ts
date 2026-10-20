import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import type { SessionEvent } from "~/types";
import { array, boolean, number, object, string } from "yup";
import { Role } from "~/generated/prisma/enums";

let handlerFunc = async (event: SessionEvent) => {
  const { id, name, email, roles, cookingGroupId, username, isActive } = event.data;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { roles: true },
  });

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const wasActiveAdmin = user.isActive && user.roles.some(({ role }) => role === Role.ADMIN);
      const remainsActiveAdmin = isActive && roles.includes(Role.ADMIN);

      if (wasActiveAdmin && !remainsActiveAdmin) {
        const otherActiveAdmins = await transaction.user.count({
          where: {
            id: { not: id },
            isActive: true,
            roles: { some: { role: Role.ADMIN } },
          },
        });

        if (otherActiveAdmins === 0) {
          throw createError({
            statusCode: 403,
            statusMessage: "At least one other active admin is required",
          });
        }
      }

      const isReactivating = !user.isActive && isActive;
      const averageCookingPoints = isReactivating
        ? await transaction.user.aggregate({
            where: {
              isActive: true,
              ...(cookingGroupId === null ? {} : { cookingGroupId }),
            },
            _avg: { cookingpoints: true },
          })
        : null;

      return transaction.user.update({
        where: { id },
        data: {
          name,
          username,
          email,
          isActive,
          ...(averageCookingPoints && {
            cookingpoints: Math.round(averageCookingPoints._avg.cookingpoints ?? 0),
          }),
          roles: {
            deleteMany: {},
            create: roles.map((role: Role) => ({ role })),
          },
          cookingGroupId,
        },
      });
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "statusCode" in error) {
      throw error;
    }
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
      username: string().required("Username is required"),
      cookingGroupId: number().integer().nullable().defined(),
      isActive: boolean().required(),
    })
  ).handle({
    route: "/api/admin/editUser",
    method: "POST",
    allowType: "ROLE",
    role: ["ADMIN"],
  });
});
