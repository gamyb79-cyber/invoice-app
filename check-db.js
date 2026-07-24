const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const cols = await prisma.PRAGMA table_info(User);
  console.log("COLUMNS:", JSON.stringify(cols.map(c => c.name)));
  const user = await prisma.user.findFirst({ where: { email: "ga.myb79@gmail.com" } });
  if (user) {
    console.log("USER FOUND:", user.email);
    console.log("resetToken:", user.resetToken);
    console.log("resetTokenExpiry:", user.resetTokenExpiry);
  } else {
    console.log("NO USER FOUND");
    const all = await prisma.user.findMany({ select: { email: true } });
    console.log("All emails:", JSON.stringify(all));
  }
}
main().catch(console.error).finally(() => prisma.());