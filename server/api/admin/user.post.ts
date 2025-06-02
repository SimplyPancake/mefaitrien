import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { SessionEvent } from "~/types";
import { number, object, string } from "yup";

let handlerFunc = async (event: SessionEvent) => {
  const { id, name, email, role, cookingGroupId, username } = event.data;

  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
  });

  if (admins.length == 1 && admins[0].id == id && role == "USER") {
    // If the last admin being demoted from admin is an admin, that cannot happen
    throw createError({ status: 403, statusMessage: "Last admin cannot become regular user" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        name: name,
        username: username,
        email: email,
        role: role,
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
      role: string().oneOf(["ADMIN", "USER"], "Invalid role").required("Role is required"),
      username: string(),
      cookingGroupId: string().nullable(),
    })
  ).handle({
    route: "/api/admin/editUser",
    method: "POST",
    allowType: "AUTHENTICATED",
    role: ["ADMIN"],
  });
});
