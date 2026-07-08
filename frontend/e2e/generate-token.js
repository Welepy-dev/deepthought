/**
 * Runs INSIDE the backend container (piped over stdin via `docker exec -i`)
 * so it reuses the container's own DATABASE_URL/JWT_SECRET and node_modules —
 * no secrets or DB connection details need to exist on the host.
 * Prints a single JSON line: { token, userId, login, email }.
 */
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

(async () => {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({
    where: { isBanned: false },
    select: { id: true, login: true, email: true, role: true },
  });
  await prisma.$disconnect();

  if (!user) {
    console.error('NO_USER: no non-banned seed user found for e2e smoke tests');
    process.exit(1);
  }

  const token = jwt.sign(
    { sub: user.id, login: user.login, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  console.log(JSON.stringify({ token, userId: user.id, login: user.login, email: user.email }));
})();
