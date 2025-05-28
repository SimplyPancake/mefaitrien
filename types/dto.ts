import type { CookingGroup } from "@prisma/client";

export interface AdminUserDTO {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  cookingGroup?: {
    id: number;
    name: string;
  };
}

export interface AdminUsersDTO {
  users: AdminUserDTO[];
  cookingGroups: CookingGroup[];
}
