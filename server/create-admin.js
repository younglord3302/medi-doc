const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medi-doc', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected');

    // Check if admin user already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists!');
      console.log('Email:', adminExists.email);
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@medidoc.com',
      password: 'admin123!',
      role: 'admin'
    });

    console.log('✓ Default admin user created successfully!');
    console.log('────────────────────────────────────');
    console.log('Email: admin@medidoc.com');
    console.log('Password: admin123!');
    console.log('Role: admin');
    console.log('────────────────────────────────────');
    console.log('⚠️  IMPORTANT: Please change these credentials after first login!');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createAdminUser();
