import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: Role;
    } & NonNullable<DefaultSession["user"]>;
  }

  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
  }
}