import type { H3Event, HTTPMethod } from "h3";

export enum AllowType {
  ANYONE,
  AUTHENTICATED,
  ROLE,
}

export type ServerAuthConfig = {
  route: string;
  method: HTTPMethod;
  allowType: AllowType | string;
  role?: string[];
};

export type SessionDataDto = {
  id: number;
  name: string;
  username: string;
  cookingGroup: string;
  role: string;
};

export interface SessionEvent extends H3Event {
  session: SessionDataDto;
}
