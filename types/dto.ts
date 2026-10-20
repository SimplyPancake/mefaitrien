import type {
  Availability,
  AvailabilityType,
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
}

export interface CookingPointsOverviewDto {
  users: CookingPointsUserDto[];
  cookingGroups: Array<Pick<CookingGroup, "id" | "name">>;
}

export interface CreatedRosterMonth {
  year: number;
  month: number;
}

export interface ExtraAvailability extends Availability {
  user: User;
}
export interface ManageMonthDto extends MonthRoster {
  availabilities: ExtraAvailability[];
  blockedDates: BlockedDay[];
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
