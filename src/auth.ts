import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestIp } from "@/lib/security/request-ip";

const credentialsSchema = z.object({
  email: z.string().email().max(254).transform((email) => email.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const requestHeaders = await headers();
        const clientIp = getRequestIp(requestHeaders);
        const allowed = await checkRateLimit(
          "credential-signin",
          `${clientIp}:${parsed.data.email}`,
          8,
          900,
        );
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash || !user.emailVerified) return null;
        if (!(await compare(parsed.data.password, user.passwordHash))) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      const role = typeof token.role === "string" && Object.values(Role).includes(token.role as Role)
        ? token.role as Role
        : undefined;
      if (session.user && token.sub && role) {
        session.user.id = token.sub;
        session.user.role = role;
      }
      return session;
    },
  },
});