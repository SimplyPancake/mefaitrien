import prisma from "@@/lib/prisma";
import { BaseEventHandler } from "~/server/utils/handlers/baseEventHandler";
import { H3Event } from "h3";
import { object, string } from "yup";

let handlerFunc = async (event: H3Event) => {
  const body = await readBody(event);

  // Define validation schema
  const schema = object({
    id: string().required("User ID is required"),
    name: string().required("Name is required"),
    email: string().email("Invalid email address").required("Email is required"),
    role: string().oneOf(["ADMIN", "USER"], "Invalid role").required("Role is required"),
    cookingGroupId: string().nullable(),
  });

  try {
    await schema.validate(body);
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e.message });
  }

  const { id, name, email, role, cookingGroupId } = body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        cookingGroupId,
      },
    });

    return updatedUser;
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: "Failed to update user" });
  }
};

export default defineEventHandler(async (event) => {
  return new BaseEventHandler(event, handlerFunc).handleConfig({
    route: "/api/admin/editUser",
    method: "POST",
    allowType: "AUTHENTICATED",
    role: ["ADMIN"],
  });
});
