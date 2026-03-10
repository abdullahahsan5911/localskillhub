import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const checkUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total Users: ${totalUsers}\n`);

    // Get all users
    const users = await User.find().select('-passwordHash').limit(20);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log('👥 Users in Database:\n');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Interests: ${user.interests.join(', ') || 'None'}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log(`   ID: ${user._id}\n`);
      });
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUsers();
