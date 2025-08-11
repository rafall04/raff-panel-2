/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";


declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    deviceId: string;
  }
}

declare module "next-auth" {
  interface User extends User {
    deviceId: string;
  }
  
  interface Session {
    user: User & {
      id: string;
      deviceId: string;
    };
  }
}