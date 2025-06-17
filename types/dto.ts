import type {
  Availability,
  AvailabilityType,
  BlockedDay,
  CookingGroup,
  MonthRoster,
  User,
} from "@prisma/client";

export interface AdminUserDTO {
  id: number;
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
// const result = Object.values(groupedUsers).map((group) => ({
//   id: group.id,
//   name: group.name,
//   people: group.people.map((person) => ({
//     id: person.id,
//     name: person.name,
//   })),
// }));
