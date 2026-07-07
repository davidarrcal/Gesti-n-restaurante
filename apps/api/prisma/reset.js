const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    await p.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE;');
    await p.$executeRawUnsafe('CREATE SCHEMA public;');
    console.log('Schema reset OK');
  } catch (e) {
    console.error('Reset error:', e.message);
  } finally {
    await p.$disconnect();
  }
})();