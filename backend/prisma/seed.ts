import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'changeme-admin-password'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user already exists: ${email}`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, passwordHash, role: 'admin' },
  })

  console.log(`Created admin user: ${user.email} (id: ${user.id})`)
  console.log('IMPORTANT: Change the admin password before going to production!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
