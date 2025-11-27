const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medi-doc', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');

  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists!');
      console.log('Email:', adminExists.email);
      process.exit(0);
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
    console.log('   1. Log in with the above credentials');
    console.log('   2. Go to your profile settings (to be implemented)');
    console.log('   3. Change the password to something secure');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
