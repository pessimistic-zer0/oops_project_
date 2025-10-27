import 'dotenv/config';
import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../utils/db.js';
import User from '../models/User.js';

async function main() {
  await connectDB(process.env.MONGO_URI);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hostel1.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123!';
  const workerEmail = process.env.WORKER_EMAIL || 'worker1@hostel1.com';
  const workerPassword = process.env.WORKER_PASSWORD || 'Worker@123!';

  // Upsert Admin
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'admin'
    });
    console.log('✅ Created admin:', admin.email);
  } else {
    console.log('ℹ️ Admin already exists:', admin.email);
  }

  // Upsert Worker
  let worker = await User.findOne({ email: workerEmail });
  if (!worker) {
    worker = await User.create({
      name: 'Worker One',
      email: workerEmail,
      passwordHash: await bcrypt.hash(workerPassword, 10),
      role: 'worker'
    });
    console.log('✅ Created worker:', worker.email);
  } else {
    console.log('ℹ️ Worker already exists:', worker.email);
  }

  await disconnectDB();
}

main().catch(async (err) => {
  console.error('Seed error:', err);
  await disconnectDB();
  process.exit(1);
});