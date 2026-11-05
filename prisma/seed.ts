import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 20) {
    throw new Error("Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 20 characters.");
  }
  const passwordHash = await hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: { email, name: "Site administrator", passwordHash, emailVerified: new Date(), role: "ADMIN" },
    update: { role: "ADMIN", emailVerified: new Date() },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());