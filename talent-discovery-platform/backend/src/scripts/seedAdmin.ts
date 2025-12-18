import { sequelize } from '../config/database';
import { User } from '../models';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('Admin123!', salt);

    const [user, created] = await User.findOrCreate({
      where: { email: 'jasonacisco@gmail.com' },
      defaults: {
        email: 'jasonacisco@gmail.com',
        username: 'jason',
        firstName: 'Jason',
        lastName: 'Cisco',
        passwordHash: passwordHash,
        role: 'admin',
        isVerified: true,
        isActive: true
      }
    });

    if (created) {
      console.log('Admin user created successfully!');
      console.log('Email: jasonacisco@gmail.com');
      console.log('Password: Admin123!');
    } else {
      console.log('User already exists, updating to admin...');
      await user.update({ role: 'admin', isVerified: true, isActive: true });
      console.log('User updated to admin');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
