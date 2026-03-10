import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const testRoleUpdate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userId = '69b09ef220a47d719e361e67';
    
    // Get user before update
    const userBefore = await User.findById(userId);
    console.log('BEFORE UPDATE:');
    console.log(`Role: ${userBefore.role}`);
    console.log(`Interests: ${userBefore.interests.join(', ')}\n`);

    // Try to update role
    const updated = await User.findByIdAndUpdate(
      userId,
      { role: 'client' },
      { new: true, runValidators: true }
    );

    console.log('AFTER UPDATE:');
    console.log(`Role: ${updated.role}`);
    console.log(`Interests: ${updated.interests.join(', ')}\n`);

    await mongoose.connection.close();
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testRoleUpdate();
