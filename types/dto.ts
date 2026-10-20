import type {
  Availability,
  AvailabilityType,
  AssignedDay,
  BlockedDay,
  CookingGroup,
  MonthRoster,
  Role,
  User,
} from "../generated/prisma/browser";

export interface AdminUserDTO {
  id: number;
  name: string;
  username: string;
  email: string;
  roles: Role[];
  isActive: boolean;
  cookingGroup?: {
    id: number;
    name: string;
  };
}

export interface AdminUsersDTO {
  users: AdminUserDTO[];
  cookingGroups: CookingGroup[];
}

export interface CookingPointsUserDto {
  id: number;
  name: string;
  cookingpoints: number;
  cookingGroupId: number | null;
  cookingGroupName: string | null;
  isActive: boolean;
}

export interface CookingPointsOverviewDto {
  users: CookingPointsUserDto[];
  cookingGroups: Array<Pick<CookingGroup, "id" | "name">>;
}

export interface CookingPointsManagementUserDto extends CookingPointsUserDto {
  basePoints: number;
  computedPoints: number;
}

export interface CookingPointsManagementDto {
  users: CookingPointsManagementUserDto[];
  cookingGroups: Array<Pick<CookingGroup, "id" | "name">>;
}

export interface CreatedRosterMonth {
  year: number;
  month: number;
}

export interface ExtraAvailability extends Availability {
  user: User;
}

export type AssignedDayDto = Pick<
  AssignedDay,
  "id" | "day" | "userId" | "monthRosterId" | "cookingGroupId"
> & {
  user: Pick<User, "id" | "name">;
  cookingGroup: Pick<CookingGroup, "id" | "name">;
};

export interface ManageMonthDto extends MonthRoster {
  availabilities: ExtraAvailability[];
  blockedDates: BlockedDay[];
  assignedDays: AssignedDayDto[];
  filledIn: number;
  maxAssigned: number;
  daysWithoutCook?: number;
  averageAvailability: number;
}

export interface GroupUsersDto {
  id: number;
  name: string;
  people: Array<{
    id: number;
    name: string;
    isActive: boolean;
    availability?: AvailabilityType;
  }>;
}

// Dto for assigning users in a month
export interface AssignedUsersDto {
  name: string;
  people: Array<{
    date: Date;
    id: number;
    name: string;
  }>;
}

export type groupAssign = Array<{
  groupName: string;
  groupId: number;
  availabilities: Array<{
    userId: number;
    day: number;
    userName: string;
  }>;
}>;
// const result = Object.values(groupedUsers).map((group) => ({
//   id: group.id,
//   name: group.name,
//   people: group.people.map((person) => ({
//     id: person.id,
//     name: person.name,
//   })),
// }));
