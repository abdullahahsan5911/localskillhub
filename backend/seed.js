import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import FreelancerProfile from './src/models/FreelancerProfile.js';
import Job from './src/models/Job.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await FreelancerProfile.deleteMany({});
    await Job.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create sample users
    const users = [];
    
    // Freelancers
    const freelancer1 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      passwordHash: 'password123',
      role: 'freelancer',
      location: {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        coordinates: {
          type: 'Point',
          coordinates: [72.8777, 19.0760]
        }
      },
      isEmailVerified: true,
      verifiedBadges: [
        { type: 'email', verifiedAt: new Date() },
        { type: 'phone', verifiedAt: new Date() }
      ],
      interests: ['Web Development', 'Graphic Design']
    });

    const freelancer2 = await User.create({
      name: 'Arjun Patel',
      email: 'arjun@example.com',
      passwordHash: 'password123',
      role: 'freelancer',
      location: {
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        coordinates: {
          type: 'Point',
          coordinates: [77.1025, 28.7041]
        }
      },
      isEmailVerified: true,
      verifiedBadges: [
        { type: 'email', verifiedAt: new Date() }
      ],
      interests: ['Mobile Apps', 'UI/UX Design']
    });

    // Clients
    const client1 = await User.create({
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      passwordHash: 'password123',
      role: 'client',
      location: {
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        coordinates: {
          type: 'Point',
          coordinates: [77.5946, 12.9716]
        }
      },
      isEmailVerified: true
    });

    console.log('✅ Created users');

    // Create freelancer profiles
    await FreelancerProfile.create({
      userId: freelancer1._id,
      title: 'Full Stack Developer & UI Designer',
      bio: 'Passionate developer with 5+ years of experience in web development and design',
      skills: [
        { name: 'React', level: 'expert', yearsOfExperience: 5 },
        { name: 'Node.js', level: 'expert', yearsOfExperience: 4 },
        { name: 'Figma', level: 'intermediate', yearsOfExperience: 3 }
      ],
      rates: {
        minRate: 1500,
        maxRate: 3000,
        currency: 'INR',
        rateType: 'hourly'
      },
      availability: {
        status: 'available',
        hoursPerWeek: 40,
        timezone: 'Asia/Kolkata'
      },
      localScore: 85,
      globalScore: 78,
      skillScore: 90,
      languages: [
        { language: 'English', proficiency: 'fluent' },
        { language: 'Hindi', proficiency: 'native' }
      ]
    });

    await FreelancerProfile.create({
      userId: freelancer2._id,
      title: 'Mobile App Developer',
      bio: 'Expert in React Native and Flutter development',
      skills: [
        { name: 'React Native', level: 'expert', yearsOfExperience: 4 },
        { name: 'Flutter', level: 'intermediate', yearsOfExperience: 2 },
        { name: 'Firebase', level: 'expert', yearsOfExperience: 3 }
      ],
      rates: {
        minRate: 2000,
        maxRate: 4000,
        currency: 'INR',
        rateType: 'hourly'
      },
      availability: {
        status: 'available',
        hoursPerWeek: 30,
        timezone: 'Asia/Kolkata'
      },
      localScore: 92,
      globalScore: 85,
      skillScore: 88
    });

    console.log('✅ Created freelancer profiles');

    // Create sample jobs
    await Job.create({
      clientId: client1._id,
      title: 'E-commerce Website Development',
      description: 'Need a modern e-commerce website with payment integration',
      category: 'Web Development',
      skills: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      location: {
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        coordinates: {
          type: 'Point',
          coordinates: [77.5946, 12.9716]
        },
        radius: 50
      },
      budget: {
        type: 'fixed',
        amount: 150000,
        currency: 'INR'
      },
      status: 'open',
      remoteAllowed: true,
      experienceLevel: 'expert',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await Job.create({
      clientId: client1._id,
      title: 'Mobile App for Delivery Service',
      description: 'Looking for a mobile app developer to build a delivery management app',
      category: 'Mobile Apps',
      skills: ['React Native', 'Firebase', 'Maps API'],
      location: {
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        coordinates: {
          type: 'Point',
          coordinates: [77.5946, 12.9716]
        }
      },
      budget: {
        type: 'fixed',
        amount: 200000,
        currency: 'INR'
      },
      status: 'open',
      remoteAllowed: true,
      experienceLevel: 'intermediate'
    });

    console.log('✅ Created sample jobs');
    console.log('');
    console.log('🎉 Seed data created successfully!');
    console.log('');
    console.log('📧 Test Credentials:');
    console.log('   Freelancer 1: priya@example.com / password123');
    console.log('   Freelancer 2: arjun@example.com / password123');
    console.log('   Client: rajesh@example.com / password123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
