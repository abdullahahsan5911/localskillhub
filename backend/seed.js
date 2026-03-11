import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import FreelancerProfile from './src/models/FreelancerProfile.js';
import Job from './src/models/Job.js';
import Proposal from './src/models/Proposal.js';
import Contract from './src/models/Contract.js';
import Review from './src/models/Review.js';
import Message from './src/models/Message.js';

dotenv.config();

const img = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80&fit=crop`;
const avatar = (seed, gender = 'men') =>
  `https://randomuser.me/api/portraits/${gender}/${seed}.jpg`;

const portfolioImages = {
  webDev: [
    img('1460925895917-afdab827c52f'), img('1547658719-da2b51169166'),
    img('1593720213428-28a5b9e94613'), img('1498050108023-c5249f4df085'),
  ],
  design: [
    img('1561070791-2526d30994b5'), img('1626785774573-4b799315345d'),
    img('1558618666-fcd25c85cd64'), img('1609921212029-bb5a28e60960'),
  ],
  mobile: [
    img('1512941937938-c5b5b3c5e4b9'), img('1555421689-d68471e189f2'),
    img('1607252650355-f7fd0460ccdb'), img('1616348436168-de43ad0db179'),
  ],
  marketing: [
    img('1432888498266-38ffec3eaf0a'), img('1533750349088-cd871a92f312'),
    img('1504868584819-f8e8b4b6d7e3'), img('1551288049-bebda4e38f71'),
  ],
  photo: [
    img('1542038374679-a6d7c83a61e7'), img('1506905925346-21bda4d32df4'),
    img('1469474968028-56623f02e42e'), img('1501854140801-50d013698927'),
  ],
  video: [
    img('1574717024653-61fd2cf4d44d'), img('1536240478227-bf010a1f5b6c'),
    img('1492691527719-9d1e07e534b4'), img('1550686041-366ad85a1355'),
  ],
  writing: [
    img('1455390582262-044cdead277a'), img('1471107191679-f26174d2d41e'),
    img('1506880018603-83d5b814b5a6'), img('1519791883288-dc8bd696e667'),
  ],
};

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('password123', 10);

    await Promise.all([
      User.deleteMany({}),
      FreelancerProfile.deleteMany({}),
      Job.deleteMany({}),
      Proposal.deleteMany({}),
      Contract.deleteMany({}),
      Review.deleteMany({}),
      Message.deleteMany({}),
    ]);
    console.log('Cleared all collections');

    // CLIENTS
    const [rajesh, kavya, vikram, ananya, suresh] = await User.insertMany([
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        passwordHash: hashedPassword,
        role: 'client',
        avatar: avatar(11, 'men'),
        location: { city: 'Bangalore', state: 'Karnataka', country: 'India', coordinates: { type: 'Point', coordinates: [77.5946, 12.9716] } },
        isEmailVerified: true, isPhoneVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }, { type: 'phone', verifiedAt: new Date() }],
      },
      {
        name: 'Kavya Reddy',
        email: 'kavya@example.com',
        passwordHash: hashedPassword,
        role: 'client',
        avatar: avatar(22, 'women'),
        location: { city: 'Hyderabad', state: 'Telangana', country: 'India', coordinates: { type: 'Point', coordinates: [78.4867, 17.3850] } },
        isEmailVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }],
      },
      {
        name: 'Vikram Singh',
        email: 'vikram@example.com',
        passwordHash: hashedPassword,
        role: 'client',
        avatar: avatar(33, 'men'),
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India', coordinates: { type: 'Point', coordinates: [72.8777, 19.0760] } },
        isEmailVerified: true, isPhoneVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }, { type: 'phone', verifiedAt: new Date() }],
      },
      {
        name: 'Ananya Iyer',
        email: 'ananya@example.com',
        passwordHash: hashedPassword,
        role: 'client',
        avatar: avatar(44, 'women'),
        location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India', coordinates: { type: 'Point', coordinates: [80.2707, 13.0827] } },
        isEmailVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }],
      },
      {
        name: 'Suresh Nair',
        email: 'suresh@example.com',
        passwordHash: hashedPassword,
        role: 'client',
        avatar: avatar(55, 'men'),
        location: { city: 'Kochi', state: 'Kerala', country: 'India', coordinates: { type: 'Point', coordinates: [76.2673, 9.9312] } },
        isEmailVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }],
      },
    ]);
    console.log('Created 5 clients');

    // FREELANCERS
    const [priya, arjun, meera, rohan, sanjay, divya, kiran, neha] = await User.insertMany([
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        passwordHash: hashedPassword,
        role: 'freelancer',
        avatar: avatar(1, 'women'),
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India', coordinates: { type: 'Point', coordinates: [72.8777, 19.0760] } },
        isEmailVerified: true, isPhoneVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }, { type: 'phone', verifiedAt: new Date() }],
        interests: ['Web Development', 'UI/UX Design'],
        socialLinks: { github: 'https://github.com/priya', linkedin: 'https://linkedin.com/in/priya' },
      },
      {
        name: 'Arjun Patel',
        email: 'arjun@example.com',
        passwordHash: hashedPassword,
        role: 'freelancer',
        avatar: avatar(2, 'men'),
        location: { city: 'Ahmedabad', state: 'Gujarat', country: 'India', coordinates: { type: 'Point', coordinates: [72.5714, 23.0225] } },
        isEmailVerified: true, isPhoneVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }, { type: 'phone', verifiedAt: new Date() }],
        interests: ['Mobile Apps', 'React Native'],
        socialLinks: { github: 'https://github.com/arjun' },
      },
      {
        name: 'Meera Nair',
        email: 'meera@example.com',
        passwordHash: hashedPassword,
        role: 'freelancer',
        avatar: avatar(3, 'women'),
        location: { city: 'Kochi', state: 'Kerala', country: 'India', coordinates: { type: 'Point', coordinates: [76.2673, 9.9312] } },
        isEmailVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }],
        interests: ['Graphic Design', 'Branding'],
        socialLinks: { portfolio: 'https://meera.design' },
      },
      {
        name: 'Rohan Verma',
        email: 'rohan@example.com',
        passwordHash: hashedPassword,
        role: 'freelancer',
        avatar: avatar(4, 'men'),
        location: { city: 'Pune', state: 'Maharashtra', country: 'India', coordinates: { type: 'Point', coordinates: [73.8567, 18.5204] } },
        isEmailVerified: true, isPhoneVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }, { type: 'phone', verifiedAt: new Date() }],
        interests: ['Digital Marketing', 'SEO'],
        socialLinks: { linkedin: 'https://linkedin.com/in/rohan' },
      },
      {
        name: 'Sanjay Gupta',
        email: 'sanjay@example.com',
        passwordHash: hashedPassword,
        role: 'freelancer',
        avatar: avatar(5, 'men'),
        location: { city: 'Delhi', state: 'Delhi', country: 'India', coordinates: { type: 'Point', coordinates: [77.1025, 28.7041] } },
        isEmailVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }],
        interests: ['Photography', 'Videography'],
        socialLinks: { instagram: 'https://instagram.com/sanjay' },
      },
      {
        name: 'Divya Menon',
        email: 'divya@example.com',
        passwordHash: hashedPassword,
        role: 'freelancer',
        avatar: avatar(6, 'women'),
        location: { city: 'Bangalore', state: 'Karnataka', country: 'India', coordinates: { type: 'Point', coordinates: [77.5946, 12.9716] } },
        isEmailVerified: true, isPhoneVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }, { type: 'phone', verifiedAt: new Date() }],
        interests: ['Content Writing', 'Copywriting'],
      },
      {
        name: 'Kiran Rao',
        email: 'kiran@example.com',
        passwordHash: hashedPassword,
        role: 'freelancer',
        avatar: avatar(7, 'men'),
        location: { city: 'Hyderabad', state: 'Telangana', country: 'India', coordinates: { type: 'Point', coordinates: [78.4867, 17.3850] } },
        isEmailVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }],
        interests: ['Video Editing', 'Motion Graphics'],
      },
      {
        name: 'Neha Joshi',
        email: 'neha@example.com',
        passwordHash: hashedPassword,
        role: 'freelancer',
        avatar: avatar(8, 'women'),
        location: { city: 'Jaipur', state: 'Rajasthan', country: 'India', coordinates: { type: 'Point', coordinates: [75.7873, 26.9124] } },
        isEmailVerified: true, isPhoneVerified: true,
        verifiedBadges: [{ type: 'email', verifiedAt: new Date() }, { type: 'phone', verifiedAt: new Date() }],
        interests: ['UI/UX Design', 'Figma'],
      },
    ]);
    console.log('Created 8 freelancers');

    // FREELANCER PROFILES
    await FreelancerProfile.insertMany([
      {
        userId: priya._id,
        title: 'Full-Stack Developer & UI Engineer',
        bio: 'I build fast, beautiful, and scalable web apps using React, Node.js and MongoDB. 5+ years turning ideas into production-ready products. Worked with 40+ clients across India and Southeast Asia.',
        skills: [
          { name: 'React', level: 'expert', yearsOfExperience: 5 },
          { name: 'Node.js', level: 'expert', yearsOfExperience: 5 },
          { name: 'TypeScript', level: 'expert', yearsOfExperience: 3 },
          { name: 'MongoDB', level: 'intermediate', yearsOfExperience: 4 },
          { name: 'Figma', level: 'intermediate', yearsOfExperience: 3 },
          { name: 'Tailwind CSS', level: 'expert', yearsOfExperience: 3 },
        ],
        rates: { minRate: 2000, maxRate: 4000, currency: 'INR', rateType: 'hourly' },
        availability: { status: 'available', hoursPerWeek: 40 },
        localScore: 92, globalScore: 85, completedJobs: 38,
        ratings: { average: 4.9, count: 36 },
        portfolio: [
          {
            title: 'ShopLocal – E-commerce Platform',
            description: 'Built a full-stack multi-vendor marketplace with real-time inventory, Stripe integration, and admin dashboard serving 5000+ daily users.',
            images: [portfolioImages.webDev[0], portfolioImages.webDev[1]],
            link: 'https://shoplocal.example.com',
            category: 'web-development',
            tags: ['React', 'Node.js', 'MongoDB', 'Stripe'],
            completedAt: new Date('2025-11-01'),
          },
          {
            title: 'HireMe – Freelance Platform UI',
            description: 'Designed and developed a Behance-inspired portfolio platform with real-time chat, gig listings, and proposal flow.',
            images: [portfolioImages.design[0], portfolioImages.design[1]],
            link: 'https://hireme.example.com',
            category: 'ui-ux-design',
            tags: ['Figma', 'React', 'Tailwind CSS'],
            completedAt: new Date('2025-09-15'),
          },
          {
            title: 'FinTrack – Personal Finance Dashboard',
            description: 'A responsive web app for tracking expenses, investments, and savings goals with charts and PDF exports.',
            images: [portfolioImages.webDev[2]],
            link: 'https://fintrack.example.com',
            category: 'web-development',
            tags: ['React', 'Chart.js', 'Express'],
            completedAt: new Date('2025-07-10'),
          },
        ],
        education: [{ institution: 'VJTI Mumbai', degree: 'B.Tech', field: 'Computer Engineering', startYear: 2015, endYear: 2019 }],
        languages: [{ language: 'English', proficiency: 'fluent' }, { language: 'Hindi', proficiency: 'native' }],
        certifications: [{ name: 'AWS Certified Developer', issuedBy: 'Amazon Web Services', issuedDate: new Date('2024-03-01') }],
      },
      {
        userId: arjun._id,
        title: 'React Native & Flutter Mobile Developer',
        bio: 'I specialise in cross-platform mobile apps — from MVP to App Store delivery. Built 20+ apps with 100k+ combined downloads.',
        skills: [
          { name: 'React Native', level: 'expert', yearsOfExperience: 4 },
          { name: 'Flutter', level: 'intermediate', yearsOfExperience: 2 },
          { name: 'Firebase', level: 'expert', yearsOfExperience: 4 },
          { name: 'TypeScript', level: 'intermediate', yearsOfExperience: 3 },
        ],
        rates: { minRate: 1800, maxRate: 3500, currency: 'INR', rateType: 'hourly' },
        availability: { status: 'available', hoursPerWeek: 35 },
        localScore: 88, globalScore: 80, completedJobs: 22,
        ratings: { average: 4.8, count: 21 },
        portfolio: [
          {
            title: 'GroceryGo – Delivery App',
            description: 'React Native grocery delivery app with real-time tracking, payment gateway, and push notifications. 50k+ downloads.',
            images: [portfolioImages.mobile[0], portfolioImages.mobile[1]],
            link: 'https://grocerygo.example.com',
            category: 'mobile-apps',
            tags: ['React Native', 'Firebase', 'Stripe'],
            completedAt: new Date('2025-10-20'),
          },
          {
            title: 'MediBook – Doctor Appointment Flutter App',
            description: 'Appointment booking, video consultation, and medical record management built with Flutter and Firebase.',
            images: [portfolioImages.mobile[2]],
            category: 'mobile-apps',
            tags: ['Flutter', 'Firebase', 'Dart'],
            completedAt: new Date('2025-08-05'),
          },
        ],
        education: [{ institution: 'Nirma University', degree: 'B.Tech', field: 'Information Technology', startYear: 2016, endYear: 2020 }],
        languages: [{ language: 'English', proficiency: 'fluent' }, { language: 'Gujarati', proficiency: 'native' }],
      },
      {
        userId: meera._id,
        title: 'Brand Identity & Graphic Designer',
        bio: "I create logos, brand guidelines, and print materials that tell your story. 7 years in design, featured in Behance's curated gallery twice.",
        skills: [
          { name: 'Adobe Illustrator', level: 'expert', yearsOfExperience: 7 },
          { name: 'Photoshop', level: 'expert', yearsOfExperience: 7 },
          { name: 'Figma', level: 'expert', yearsOfExperience: 4 },
          { name: 'Logo Design', level: 'expert', yearsOfExperience: 7 },
        ],
        rates: { minRate: 1500, maxRate: 3000, currency: 'INR', rateType: 'hourly' },
        availability: { status: 'available', hoursPerWeek: 30 },
        localScore: 90, globalScore: 78, completedJobs: 55,
        ratings: { average: 4.9, count: 53 },
        portfolio: [
          {
            title: 'Chai & Co. – Cafe Brand Identity',
            description: 'Complete brand identity for an artisan tea cafe chain — logo, menu design, packaging, and social media kit.',
            images: [portfolioImages.design[0], portfolioImages.design[2]],
            link: 'https://behance.net/meera/chaiandco',
            category: 'graphic-design',
            tags: ['Branding', 'Illustrator', 'Packaging'],
            completedAt: new Date('2025-12-01'),
          },
          {
            title: 'GreenRoot – NGO Visual Identity',
            description: 'Compassionate earthy brand identity for an environmental NGO including logo, letterheads, and annual report.',
            images: [portfolioImages.design[1], portfolioImages.design[3]],
            category: 'graphic-design',
            tags: ['NGO', 'Branding', 'Print'],
            completedAt: new Date('2025-09-22'),
          },
          {
            title: 'TechPro – SaaS Product UI Kit',
            description: 'Comprehensive Figma design system with 80+ components, dark/light modes, and full documentation.',
            images: [portfolioImages.design[2]],
            category: 'ui-ux-design',
            tags: ['Figma', 'Design System', 'SaaS'],
            completedAt: new Date('2025-07-14'),
          },
        ],
        education: [{ institution: 'National Institute of Design, Ahmedabad', degree: 'B.Des', field: 'Communication Design', startYear: 2014, endYear: 2018 }],
        languages: [{ language: 'English', proficiency: 'fluent' }, { language: 'Malayalam', proficiency: 'native' }],
        certifications: [{ name: 'Adobe Certified Expert – Illustrator', issuedBy: 'Adobe', issuedDate: new Date('2023-06-01') }],
      },
      {
        userId: rohan._id,
        title: 'Performance Marketing & SEO Specialist',
        bio: 'I help businesses grow through data-driven digital marketing — Google Ads, Meta Ads, SEO, and email campaigns. Managed Rs2Cr+ ad spend. Average 4x ROAS for e-commerce clients.',
        skills: [
          { name: 'Google Ads', level: 'expert', yearsOfExperience: 5 },
          { name: 'Meta Ads', level: 'expert', yearsOfExperience: 5 },
          { name: 'SEO', level: 'expert', yearsOfExperience: 6 },
          { name: 'Analytics', level: 'expert', yearsOfExperience: 5 },
        ],
        rates: { minRate: 1200, maxRate: 2500, currency: 'INR', rateType: 'hourly' },
        availability: { status: 'busy', hoursPerWeek: 20 },
        localScore: 85, globalScore: 72, completedJobs: 44,
        ratings: { average: 4.7, count: 42 },
        portfolio: [
          {
            title: 'StyleHub – 6x ROAS Meta Campaign',
            description: 'Achieved 6x ROAS for a fashion D2C brand. Scaled from Rs50k to Rs8L/month ad spend.',
            images: [portfolioImages.marketing[0], portfolioImages.marketing[1]],
            category: 'digital-marketing',
            tags: ['Meta Ads', 'D2C', 'ROAS'],
            completedAt: new Date('2025-11-15'),
          },
          {
            title: 'LegalEase – SEO: 0 to 50k Monthly Visitors',
            description: 'Grew a legal services website from 0 to 50,000 monthly organic visitors in 14 months.',
            images: [portfolioImages.marketing[2]],
            category: 'digital-marketing',
            tags: ['SEO', 'Content Strategy', 'Link Building'],
            completedAt: new Date('2025-08-30'),
          },
        ],
        education: [{ institution: 'Symbiosis International University', degree: 'MBA', field: 'Marketing', startYear: 2017, endYear: 2019 }],
        languages: [{ language: 'English', proficiency: 'fluent' }, { language: 'Hindi', proficiency: 'native' }],
        certifications: [
          { name: 'Google Ads Certified', issuedBy: 'Google', issuedDate: new Date('2024-01-15') },
          { name: 'Meta Blueprint Certified', issuedBy: 'Meta', issuedDate: new Date('2023-11-01') },
        ],
      },
      {
        userId: sanjay._id,
        title: 'Commercial & Event Photographer',
        bio: 'Capturing moments that last a lifetime. Specialised in product, corporate events, and wedding photography. 300+ events covered.',
        skills: [
          { name: 'Product Photography', level: 'expert', yearsOfExperience: 6 },
          { name: 'Event Photography', level: 'expert', yearsOfExperience: 8 },
          { name: 'Adobe Lightroom', level: 'expert', yearsOfExperience: 8 },
          { name: 'Drone Photography', level: 'intermediate', yearsOfExperience: 3 },
        ],
        rates: { minRate: 2500, maxRate: 8000, currency: 'INR', rateType: 'hourly' },
        availability: { status: 'available', hoursPerWeek: 25 },
        localScore: 82, globalScore: 68, completedJobs: 60,
        ratings: { average: 4.8, count: 58 },
        portfolio: [
          {
            title: 'Artisan Eats – Product Photography',
            description: 'Full catalogue of 200+ food product shots for a gourmet snack brand, styled and shot in studio.',
            images: [portfolioImages.photo[0], portfolioImages.photo[1]],
            category: 'photography',
            tags: ['Product', 'Food', 'Studio'],
            completedAt: new Date('2025-12-10'),
          },
          {
            title: 'TechSummit 2025 – Corporate Event',
            description: 'Official photographer for a 3-day 2000-person technology conference. 800 edited images delivered in 48 hours.',
            images: [portfolioImages.photo[2], portfolioImages.photo[3]],
            category: 'photography',
            tags: ['Corporate', 'Event', 'Conference'],
            completedAt: new Date('2025-10-05'),
          },
        ],
        education: [{ institution: 'Delhi College of Photography', degree: 'Diploma', field: 'Commercial Photography', startYear: 2013, endYear: 2015 }],
        languages: [{ language: 'Hindi', proficiency: 'native' }, { language: 'English', proficiency: 'fluent' }],
      },
      {
        userId: divya._id,
        title: 'Content Strategist & Copywriter',
        bio: 'I write copy that converts — website copy, email sequences, product descriptions, and long-form articles. Worked with 80+ brands. Former journalist.',
        skills: [
          { name: 'Copywriting', level: 'expert', yearsOfExperience: 6 },
          { name: 'SEO Writing', level: 'expert', yearsOfExperience: 5 },
          { name: 'Content Strategy', level: 'expert', yearsOfExperience: 5 },
          { name: 'Technical Writing', level: 'intermediate', yearsOfExperience: 3 },
        ],
        rates: { minRate: 800, maxRate: 2000, currency: 'INR', rateType: 'hourly' },
        availability: { status: 'available', hoursPerWeek: 40 },
        localScore: 87, globalScore: 74, completedJobs: 72,
        ratings: { average: 4.8, count: 70 },
        portfolio: [
          {
            title: 'GrowthOS – SaaS Website Rewrite',
            description: 'Rewrote a SaaS platform website copy. Conversion rate improved by 34% post-launch.',
            images: [portfolioImages.writing[0]],
            category: 'content-writing',
            tags: ['SaaS', 'Conversion Copy', 'Website'],
            completedAt: new Date('2025-11-20'),
          },
          {
            title: '12-Part Email Onboarding Sequence',
            description: 'Crafted a 12-email onboarding sequence for a fintech app. Open rate: 52%. CTR: 14%.',
            images: [portfolioImages.writing[1]],
            category: 'content-writing',
            tags: ['Email', 'Fintech', 'Onboarding'],
            completedAt: new Date('2025-09-08'),
          },
        ],
        education: [{ institution: 'Christ University, Bangalore', degree: 'MA', field: 'Journalism and Mass Communication', startYear: 2016, endYear: 2018 }],
        languages: [{ language: 'English', proficiency: 'native' }, { language: 'Kannada', proficiency: 'native' }],
      },
      {
        userId: kiran._id,
        title: 'Video Editor & Motion Graphics Designer',
        bio: 'From YouTube content to ad creatives to brand films — I edit videos that get watched till the end. 500+ videos delivered.',
        skills: [
          { name: 'Adobe Premiere Pro', level: 'expert', yearsOfExperience: 5 },
          { name: 'After Effects', level: 'expert', yearsOfExperience: 4 },
          { name: 'DaVinci Resolve', level: 'intermediate', yearsOfExperience: 2 },
          { name: 'Motion Graphics', level: 'expert', yearsOfExperience: 4 },
        ],
        rates: { minRate: 1000, maxRate: 2500, currency: 'INR', rateType: 'hourly' },
        availability: { status: 'available', hoursPerWeek: 35 },
        localScore: 80, globalScore: 70, completedJobs: 48,
        ratings: { average: 4.7, count: 46 },
        portfolio: [
          {
            title: 'Brand Anthem – Startup Launch Film',
            description: '2-minute brand film with drone footage, motion graphics, and custom sound design.',
            images: [portfolioImages.video[0], portfolioImages.video[1]],
            link: 'https://youtube.com/watch?v=example',
            category: 'video-production',
            tags: ['Brand Film', 'Motion Graphics', 'After Effects'],
            completedAt: new Date('2025-10-28'),
          },
          {
            title: 'Series of 10 YouTube Tutorial Videos',
            description: 'Edited 10 educational videos for a coding bootcamp with custom intros and animated callouts.',
            images: [portfolioImages.video[2]],
            category: 'video-production',
            tags: ['YouTube', 'Education', 'Tutorial'],
            completedAt: new Date('2025-08-18'),
          },
        ],
        education: [{ institution: 'Hyderabad Film Institute', degree: 'Certificate', field: 'Post-Production & Editing', startYear: 2018, endYear: 2019 }],
        languages: [{ language: 'Telugu', proficiency: 'native' }, { language: 'English', proficiency: 'fluent' }],
      },
      {
        userId: neha._id,
        title: 'UI/UX Designer – Figma & Design Systems',
        bio: 'I turn complex user problems into intuitive, beautiful interfaces. Specialised in SaaS, fintech, and healthcare UX. 4 years at agencies, now freelancing.',
        skills: [
          { name: 'Figma', level: 'expert', yearsOfExperience: 4 },
          { name: 'User Research', level: 'expert', yearsOfExperience: 4 },
          { name: 'Design Systems', level: 'expert', yearsOfExperience: 3 },
          { name: 'Prototyping', level: 'expert', yearsOfExperience: 4 },
        ],
        rates: { minRate: 1500, maxRate: 3500, currency: 'INR', rateType: 'hourly' },
        availability: { status: 'available', hoursPerWeek: 30 },
        localScore: 86, globalScore: 77, completedJobs: 31,
        ratings: { average: 4.9, count: 30 },
        portfolio: [
          {
            title: 'PayQuick – Fintech App Redesign',
            description: 'Full UX audit and redesign of a payment app. Reduced checkout friction by 40%.',
            images: [portfolioImages.design[2], portfolioImages.design[3]],
            link: 'https://figma.com/neha/payquick',
            category: 'ui-ux-design',
            tags: ['Fintech', 'Figma', 'UX Research'],
            completedAt: new Date('2025-12-05'),
          },
          {
            title: 'HealthPlus – Telemedicine Platform UI',
            description: 'End-to-end patient and doctor experience for a telemedicine platform. 120+ screens and a component library.',
            images: [portfolioImages.design[0]],
            category: 'ui-ux-design',
            tags: ['Healthcare', 'Design System', 'Figma'],
            completedAt: new Date('2025-09-30'),
          },
        ],
        education: [{ institution: 'Pearl Academy, Jaipur', degree: 'B.Des', field: 'Interaction Design', startYear: 2017, endYear: 2021 }],
        languages: [{ language: 'Hindi', proficiency: 'native' }, { language: 'English', proficiency: 'fluent' }],
        certifications: [{ name: 'Google UX Design Certificate', issuedBy: 'Google/Coursera', issuedDate: new Date('2022-08-01') }],
      },
    ]);
    console.log('Created 8 freelancer profiles');

    // JOBS
    const [job1, job2, job3, job4, job5, job6, job7, job8, job9, job10] = await Job.insertMany([
      {
        clientId: rajesh._id,
        title: 'React + Node.js Developer for SaaS MVP',
        description: 'We are building a B2B SaaS project management tool. Need an experienced full-stack developer to build the MVP from scratch — auth, dashboards, kanban boards, real-time collaboration, and billing. Estimated 3 months.',
        category: 'web-development',
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Socket.io'],
        location: { city: 'Bangalore', state: 'Karnataka' },
        remoteAllowed: true,
        budget: { type: 'fixed', amount: 180000, currency: 'INR' },
        duration: 'long',
        experienceLevel: 'expert',
        status: 'in-progress',
        hiredFreelancer: priya._id,
        milestones: [
          { title: 'Auth & user management', amount: 30000, status: 'approved' },
          { title: 'Dashboard & kanban', amount: 60000, status: 'in-progress' },
          { title: 'Real-time & billing', amount: 60000, status: 'pending' },
          { title: 'Testing & deployment', amount: 30000, status: 'pending' },
        ],
      },
      {
        clientId: kavya._id,
        title: 'Brand Identity Design for EdTech Startup',
        description: 'Launching an online skill-development platform for Tier 2/3 cities. Need complete brand identity: logo, colour palette, typography, brand guidelines, business card, and letterhead.',
        category: 'graphic-design',
        skills: ['Logo Design', 'Adobe Illustrator', 'Brand Strategy', 'Figma'],
        location: { city: 'Hyderabad', state: 'Telangana' },
        remoteAllowed: true,
        budget: { type: 'fixed', amount: 45000, currency: 'INR' },
        duration: 'short',
        experienceLevel: 'expert',
        status: 'completed',
        hiredFreelancer: meera._id,
      },
      {
        clientId: vikram._id,
        title: 'React Native Developer – Food Delivery App',
        description: 'Need a React Native developer for our restaurant chain food delivery app. Features: menu browsing, cart, order tracking, Razorpay payment, order history. iOS + Android.',
        category: 'mobile-apps',
        skills: ['React Native', 'Firebase', 'Razorpay', 'Push Notifications'],
        location: { city: 'Mumbai', state: 'Maharashtra' },
        remoteAllowed: false,
        budget: { type: 'fixed', amount: 120000, currency: 'INR' },
        duration: 'medium',
        experienceLevel: 'intermediate',
        status: 'in-progress',
        hiredFreelancer: arjun._id,
      },
      {
        clientId: ananya._id,
        title: 'Performance Marketing – Google & Meta Ads Management',
        description: 'D2C home decor brand needs an expert to manage Google Shopping, Search, and Meta Ads. Current spend: Rs3L/month. Goal: improve ROAS from 2x to 4x in 3 months.',
        category: 'digital-marketing',
        skills: ['Google Ads', 'Meta Ads', 'Shopping Ads', 'Analytics'],
        location: { city: 'Chennai', state: 'Tamil Nadu' },
        remoteAllowed: true,
        budget: { type: 'hourly', amount: 1500, currency: 'INR' },
        duration: 'long',
        experienceLevel: 'expert',
        status: 'open',
      },
      {
        clientId: suresh._id,
        title: 'Product Photography – Spice Brand Catalogue',
        description: 'Need product photography for 60 SKUs — individual packs, hamper sets, and lifestyle shots. Studio provided in Kochi. Deliverables: 300 edited hi-res images within 2 weeks.',
        category: 'photography',
        skills: ['Product Photography', 'Food Photography', 'Adobe Lightroom'],
        location: { city: 'Kochi', state: 'Kerala' },
        remoteAllowed: false,
        budget: { type: 'fixed', amount: 55000, currency: 'INR' },
        duration: 'short',
        experienceLevel: 'expert',
        status: 'open',
      },
      {
        clientId: rajesh._id,
        title: 'UI/UX Designer – Enterprise HR Software',
        description: 'Redesigning legacy HR portal (leave, payroll, appraisals, org chart). Need UX designer for user interviews, wireframes, hi-fi Figma prototypes, and design system. 150+ screens expected.',
        category: 'ui-ux-design',
        skills: ['Figma', 'UX Research', 'Design Systems', 'Wireframing'],
        location: { city: 'Bangalore', state: 'Karnataka' },
        remoteAllowed: true,
        budget: { type: 'fixed', amount: 95000, currency: 'INR' },
        duration: 'medium',
        experienceLevel: 'expert',
        status: 'open',
      },
      {
        clientId: kavya._id,
        title: 'Website Copywriter for SaaS Landing Page',
        description: 'Launching a project management SaaS targeting Indian SMEs. Need copy for homepage, features, pricing, and 5 email sequences (welcome, onboarding, trial-expiry, upgrade, win-back).',
        category: 'content-writing',
        skills: ['Copywriting', 'SaaS Marketing', 'Email Sequences', 'SEO Writing'],
        location: { city: 'Hyderabad', state: 'Telangana' },
        remoteAllowed: true,
        budget: { type: 'fixed', amount: 28000, currency: 'INR' },
        duration: 'short',
        experienceLevel: 'intermediate',
        status: 'open',
      },
      {
        clientId: vikram._id,
        title: 'Video Editor – YouTube Channel (Tech Reviews)',
        description: 'Tech review channel (200k subs) needs video editor for 4 videos/week. Custom intro/outro, motion graphics, subtitles, thumbnail compositing. Deliver each video within 24h of raw footage.',
        category: 'video-production',
        skills: ['Adobe Premiere Pro', 'After Effects', 'Motion Graphics'],
        location: { city: 'Mumbai', state: 'Maharashtra' },
        remoteAllowed: true,
        budget: { type: 'hourly', amount: 1200, currency: 'INR' },
        duration: 'long',
        experienceLevel: 'intermediate',
        status: 'open',
      },
      {
        clientId: ananya._id,
        title: 'Full-Stack Developer – E-commerce Website with CMS',
        description: 'Custom Next.js e-commerce site with headless CMS (Sanity). Features: product catalogue, cart, checkout (Razorpay + UPI), order management admin, and customer accounts. SEO-optimised.',
        category: 'web-development',
        skills: ['Next.js', 'Sanity CMS', 'Razorpay', 'Tailwind CSS', 'TypeScript'],
        location: { city: 'Chennai', state: 'Tamil Nadu' },
        remoteAllowed: true,
        budget: { type: 'fixed', amount: 150000, currency: 'INR' },
        duration: 'medium',
        experienceLevel: 'expert',
        status: 'open',
      },
      {
        clientId: suresh._id,
        title: 'Flutter Developer – Logistics Tracking App',
        description: 'Flutter app for driver and customer-facing logistics tracking. Features: live GPS, delivery status, e-signature, route optimisation (Google Maps), and push notifications. Backend APIs already built.',
        category: 'mobile-apps',
        skills: ['Flutter', 'Google Maps SDK', 'Firebase', 'Dart'],
        location: { city: 'Kochi', state: 'Kerala' },
        remoteAllowed: true,
        budget: { type: 'fixed', amount: 90000, currency: 'INR' },
        duration: 'medium',
        experienceLevel: 'intermediate',
        status: 'open',
      },
    ]);
    console.log('Created 10 jobs');

    // PROPOSALS
    const [prop1, prop2, prop3, prop4, prop5, prop6] = await Proposal.insertMany([
      {
        jobId: job4._id,
        freelancerId: rohan._id,
        coverLetter: "Hi Ananya, I've managed Google and Meta ad budgets of over Rs2Cr for 15+ D2C brands. I helped a similar home decor brand go from 2.1x to 5.3x ROAS over 4 months. I'd love to walk you through my exact approach. Can we schedule a 30-min call?",
        proposedRate: { amount: 1400, type: 'hourly', currency: 'INR' },
        estimatedDuration: { value: 3, unit: 'months' },
        status: 'viewed',
        viewedAt: new Date(Date.now() - 2 * 24 * 3600000),
      },
      {
        jobId: job4._id,
        freelancerId: divya._id,
        coverLetter: "Hello! While my primary expertise is content, I have 3 years of experience managing digital ad campaigns for e-commerce brands. I'd be happy to discuss a blended content + ads strategy.",
        proposedRate: { amount: 1100, type: 'hourly', currency: 'INR' },
        estimatedDuration: { value: 2, unit: 'months' },
        status: 'sent',
      },
      {
        jobId: job6._id,
        freelancerId: neha._id,
        coverLetter: "Hi Rajesh, I've redesigned enterprise HR portals for 3 companies (500-2000 employees). I approach this with a 4-week discovery sprint — user interviews with HR managers and employees — before any screens. Happy to start with a paid discovery sprint.",
        proposedRate: { amount: 1600, type: 'hourly', currency: 'INR' },
        estimatedDuration: { value: 3, unit: 'months' },
        status: 'shortlisted',
        viewedAt: new Date(Date.now() - 1 * 24 * 3600000),
        milestones: [
          { title: 'Discovery & User Research', amount: 18000 },
          { title: 'Wireframes & Low-fi', amount: 20000 },
          { title: 'Hi-fi Prototypes & Design System', amount: 40000 },
        ],
      },
      {
        jobId: job7._id,
        freelancerId: divya._id,
        coverLetter: "I've written website copy and email sequences for 12 SaaS companies including two that raised Series A post-launch. My process: brand voice discovery → copy brief → 2 draft iterations → final.",
        proposedRate: { amount: 900, type: 'hourly', currency: 'INR' },
        estimatedDuration: { value: 3, unit: 'weeks' },
        status: 'sent',
      },
      {
        jobId: job8._id,
        freelancerId: kiran._id,
        coverLetter: "Hey! I edit for 3 tech YouTube channels currently (combined 800k subs). My average turnaround is 18 hours from raw footage to final upload-ready video. I have ready-made motion graphic packs for tech reviews.",
        proposedRate: { amount: 1000, type: 'hourly', currency: 'INR' },
        estimatedDuration: { value: 6, unit: 'months' },
        status: 'sent',
      },
      {
        jobId: job5._id,
        freelancerId: sanjay._id,
        coverLetter: "I've shot catalogues for 8 food and spice brands including a major Kerala export brand. I can deliver 300 edited images in 10 days. I bring all lighting equipment. Happy to do a test shoot of 5 products first.",
        proposedRate: { amount: 50000, type: 'fixed', currency: 'INR' },
        estimatedDuration: { value: 2, unit: 'weeks' },
        status: 'shortlisted',
        viewedAt: new Date(Date.now() - 3 * 24 * 3600000),
      },
    ]);
    console.log('Created 6 proposals');

    await Job.findByIdAndUpdate(job4._id, { $push: { proposals: { $each: [prop1._id, prop2._id] } } });
    await Job.findByIdAndUpdate(job6._id, { $push: { proposals: prop3._id } });
    await Job.findByIdAndUpdate(job7._id, { $push: { proposals: prop4._id } });
    await Job.findByIdAndUpdate(job8._id, { $push: { proposals: prop5._id } });
    await Job.findByIdAndUpdate(job5._id, { $push: { proposals: prop6._id } });

    // CONTRACTS
    const [contract1, contract2, contract3] = await Contract.insertMany([
      {
        jobId: job1._id,
        clientId: rajesh._id,
        freelancerId: priya._id,
        title: 'React + Node.js SaaS MVP Development',
        description: 'Full-stack development of B2B project management SaaS MVP including auth, dashboards, real-time kanban, and Stripe billing.',
        amount: { total: 180000, type: 'fixed', currency: 'INR' },
        status: 'active',
        paymentStatus: 'escrow',
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-04-30'),
        milestones: [
          { title: 'Auth & user management', amount: 30000, status: 'approved', dueDate: new Date('2026-02-01') },
          { title: 'Dashboard & kanban board', amount: 60000, status: 'in-progress', dueDate: new Date('2026-03-01') },
          { title: 'Real-time collaboration & billing', amount: 60000, status: 'pending', dueDate: new Date('2026-04-01') },
          { title: 'Testing, QA & deployment', amount: 30000, status: 'pending', dueDate: new Date('2026-04-25') },
        ],
      },
      {
        jobId: job2._id,
        clientId: kavya._id,
        freelancerId: meera._id,
        title: 'Brand Identity Design – EdTech Startup',
        description: 'Complete brand identity package including logo, colour palette, typography, brand guidelines, business card, and letterhead.',
        amount: { total: 45000, type: 'fixed', currency: 'INR' },
        status: 'completed',
        paymentStatus: 'released',
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-02-15'),
        milestones: [
          { title: 'Logo concepts (3 directions)', amount: 15000, status: 'paid', dueDate: new Date('2026-01-18') },
          { title: 'Brand guidelines document', amount: 20000, status: 'paid', dueDate: new Date('2026-02-05') },
          { title: 'Business card & letterhead', amount: 10000, status: 'paid', dueDate: new Date('2026-02-12') },
        ],
      },
      {
        jobId: job3._id,
        clientId: vikram._id,
        freelancerId: arjun._id,
        title: 'React Native Food Delivery App – Mumbai Chain',
        description: 'Cross-platform food delivery app with real-time order tracking, Razorpay integration, and push notifications.',
        amount: { total: 120000, type: 'fixed', currency: 'INR' },
        status: 'active',
        paymentStatus: 'escrow',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-04-30'),
        milestones: [
          { title: 'App scaffolding & auth', amount: 20000, status: 'approved', dueDate: new Date('2026-02-15') },
          { title: 'Menu, cart & checkout', amount: 50000, status: 'in-progress', dueDate: new Date('2026-03-20') },
          { title: 'Order tracking & push notifications', amount: 30000, status: 'pending', dueDate: new Date('2026-04-10') },
          { title: 'Testing & Play Store submission', amount: 20000, status: 'pending', dueDate: new Date('2026-04-28') },
        ],
      },
    ]);
    console.log('Created 3 contracts');

    // REVIEWS
    await Review.insertMany([
      {
        contractId: contract2._id,
        jobId: job2._id,
        reviewerId: kavya._id,
        reviewedUserId: meera._id,
        reviewerType: 'client',
        rating: { overall: 5, communication: 5, quality: 5, professionalism: 5, deadlineCompliance: 5, valueForMoney: 4 },
        reviewText: "Meera was an absolute pleasure to work with. She nailed our brand essence from the first brief — the logo is both modern and deeply rooted in Indian culture. Delivered 3 days ahead of schedule and was incredibly responsive. The brand guidelines are so thorough our internal team could use them without explanation. Highly recommended!",
        pros: ['Exceptional quality', 'Early delivery', 'Great communication', 'Thorough brand guidelines'],
        wouldRecommend: true,
        isPublic: true,
      },
      {
        contractId: contract2._id,
        jobId: job2._id,
        reviewerId: meera._id,
        reviewedUserId: kavya._id,
        reviewerType: 'freelancer',
        rating: { overall: 5, communication: 5, quality: 5, professionalism: 5, deadlineCompliance: 5, valueForMoney: 5 },
        reviewText: "Kavya came in with a very clear brief and good references. Feedback was always constructive and timely — I never waited more than 2 hours for approvals. She paid on time and even added a bonus. Would love to work with her again.",
        pros: ['Clear brief', 'Fast approvals', 'Paid promptly', 'Great to work with'],
        wouldRecommend: true,
        isPublic: true,
      },
      {
        contractId: contract1._id,
        jobId: job1._id,
        reviewerId: rajesh._id,
        reviewedUserId: priya._id,
        reviewerType: 'client',
        rating: { overall: 5, communication: 5, quality: 5, professionalism: 5, deadlineCompliance: 4, valueForMoney: 5 },
        reviewText: "Priya is exactly the kind of full-stack developer you want on your team. Clean code, great documentation, and she proactively flagged scaling issues we hadn't considered. One milestone in and already convinced. The React components are reusable and well-structured.",
        pros: ['Clean code', 'Proactive communication', 'Strong TypeScript skills', 'Great problem-solving'],
        wouldRecommend: true,
        isPublic: true,
      },
      {
        contractId: contract3._id,
        jobId: job3._id,
        reviewerId: vikram._id,
        reviewedUserId: arjun._id,
        reviewerType: 'client',
        rating: { overall: 4, communication: 4, quality: 5, professionalism: 4, deadlineCompliance: 3, valueForMoney: 4 },
        reviewText: "Arjun is solid with React Native — the app scaffold he built is clean and performant. A bit slow on the initial setup phase but caught up quickly. The auth flow and navigation are excellent.",
        pros: ['Clean React Native code', 'Smooth animations', 'Good mobile UX knowledge'],
        cons: ['Slightly slow start'],
        wouldRecommend: true,
        isPublic: true,
      },
    ]);
    console.log('Created 4 reviews');

    // MESSAGES
    const conv1Id = [rajesh._id.toString(), priya._id.toString()].sort().join('_');
    const conv2Id = [kavya._id.toString(), meera._id.toString()].sort().join('_');
    const conv3Id = [vikram._id.toString(), arjun._id.toString()].sort().join('_');
    const conv4Id = [ananya._id.toString(), rohan._id.toString()].sort().join('_');
    const conv5Id = [suresh._id.toString(), sanjay._id.toString()].sort().join('_');

    const now = Date.now();
    const mins = (n) => new Date(now - n * 60000);

    await Message.insertMany([
      // Conv 1 – Rajesh ↔ Priya
      { conversationId: conv1Id, senderId: rajesh._id, receiverId: priya._id, content: "Hi Priya! Just reviewed your portfolio — impressive work on the FinTrack dashboard. I'd love to discuss our SaaS project.", createdAt: mins(2880), isRead: true },
      { conversationId: conv1Id, senderId: priya._id, receiverId: rajesh._id, content: "Hi Rajesh! Thank you — FinTrack was a fun challenge. I'd be happy to hear more about your project. What stage are you at currently?", createdAt: mins(2820), isRead: true },
      { conversationId: conv1Id, senderId: rajesh._id, receiverId: priya._id, content: "We have Figma designs ready and the tech stack decided (React + Node + MongoDB). Need someone to own the build end-to-end. Are you available from mid-January?", createdAt: mins(2760), isRead: true },
      { conversationId: conv1Id, senderId: priya._id, receiverId: rajesh._id, content: "That sounds right up my alley! Yes, available from Jan 15. Could you share the Figma link and scope doc? I'll give you a detailed estimate in 24 hours.", createdAt: mins(2700), isRead: true },
      { conversationId: conv1Id, senderId: rajesh._id, receiverId: priya._id, content: "Shared the Figma and scope doc via email. Core modules: auth (Google OAuth + email), team dashboard, kanban with drag-drop, real-time comments, and Stripe billing.", createdAt: mins(1440), isRead: true },
      { conversationId: conv1Id, senderId: priya._id, receiverId: rajesh._id, content: "Reviewed everything — great scope! Sent a detailed proposal for Rs1.80L over 3 months with 4 milestones. Let me know if you'd like to adjust the breakdown.", createdAt: mins(1380), isRead: true },
      { conversationId: conv1Id, senderId: rajesh._id, receiverId: priya._id, content: "Milestone 1 approval just sent — great work on the auth module! The Google OAuth flow is smooth. Moving to Milestone 2 now.", createdAt: mins(720), isRead: true },
      { conversationId: conv1Id, senderId: priya._id, receiverId: rajesh._id, content: "Thank you! Starting on the kanban board today. Will have a WIP demo link for you by Friday. Real-time with Socket.io is going to be very satisfying!", createdAt: mins(660), isRead: false },

      // Conv 2 – Kavya ↔ Meera
      { conversationId: conv2Id, senderId: kavya._id, receiverId: meera._id, content: "Hello Meera, I came across your Chai & Co. identity on Behance and absolutely love the warm colour story. Our EdTech brand has a similar soul. Are you available in January?", createdAt: mins(5760), isRead: true },
      { conversationId: conv2Id, senderId: meera._id, receiverId: kavya._id, content: "Hi Kavya! Chai & Co. was my favourite project last year. I am free in January. Tell me more — who is your learner persona?", createdAt: mins(5700), isRead: true },
      { conversationId: conv2Id, senderId: kavya._id, receiverId: meera._id, content: "We target working professionals in Tier 2 cities — 25-35 year olds who want to upskill but feel intimidated by traditional education. Brand should say 'this is for you, you belong here.'", createdAt: mins(5640), isRead: true },
      { conversationId: conv2Id, senderId: meera._id, receiverId: kavya._id, content: "Beautiful brief. Already thinking earthy tones, approachable typography, illustration-forward logo. I'll send 3 moodboards by Monday. Does Rs45,000 for the full package work?", createdAt: mins(5580), isRead: true },
      { conversationId: conv2Id, senderId: kavya._id, receiverId: meera._id, content: "Project completed! The brand guidelines are exactly what we needed. Dev team is using them right now. You're on our radar for the next phase!", createdAt: mins(1440), isRead: true },
      { conversationId: conv2Id, senderId: meera._id, receiverId: kavya._id, content: "That makes me so happy! Looking forward to the next chapter with you. Feel free to reach out anytime.", createdAt: mins(1380), isRead: true },

      // Conv 3 – Vikram ↔ Arjun
      { conversationId: conv3Id, senderId: vikram._id, receiverId: arjun._id, content: "Arjun, your GroceryGo app looks exactly like what we need for our restaurant chain. Can you handle React Native with Razorpay integration for ~10 restaurants in Mumbai?", createdAt: mins(4320), isRead: true },
      { conversationId: conv3Id, senderId: arjun._id, receiverId: vikram._id, content: "Hi Vikram! Yes absolutely. I've integrated Razorpay in 4 React Native apps. For 10 restaurants you'll want multi-location support. Do you have backend APIs ready?", createdAt: mins(4260), isRead: true },
      { conversationId: conv3Id, senderId: vikram._id, receiverId: arjun._id, content: "Backend APIs are ready — built last month. I can share Postman collection and docs. Mainly need the mobile app and maybe some API adjustments.", createdAt: mins(4200), isRead: true },
      { conversationId: conv3Id, senderId: arjun._id, receiverId: vikram._id, content: "Perfect setup. Share the Postman collection and I'll review tonight. If the APIs are solid, I can start the app scaffold by Monday. My estimate is Rs1.20L over 3 months.", createdAt: mins(4140), isRead: true },
      { conversationId: conv3Id, senderId: vikram._id, receiverId: arjun._id, content: "Milestone 1 looks great! Clean navigation, smooth animations. Approving now. Looking forward to the menu and cart flow next week.", createdAt: mins(480), isRead: true },
      { conversationId: conv3Id, senderId: arjun._id, receiverId: vikram._id, content: "Thanks Vikram! Working on the menu category grid and add-to-cart animation today. Will push a demo build to TestFlight by Thursday!", createdAt: mins(420), isRead: false },

      // Conv 4 – Ananya ↔ Rohan
      { conversationId: conv4Id, senderId: ananya._id, receiverId: rohan._id, content: "Hi Rohan, saw your proposal for our campaigns. Impressed by the ROAS numbers on StyleHub. Have you run campaigns in the home decor category before?", createdAt: mins(1440), isRead: true },
      { conversationId: conv4Id, senderId: rohan._id, receiverId: ananya._id, content: "Hi Ananya! Yes — managed Google Shopping and Meta retargeting for HomeNest (also home decor, Chennai). Took them from 1.8x to 4.2x ROAS in 5 months. I can share the case study privately.", createdAt: mins(1380), isRead: true },
      { conversationId: conv4Id, senderId: ananya._id, receiverId: rohan._id, content: "Yes please! Also can you do a quick audit of our current campaigns as part of onboarding? Spending Rs3L/month and I feel we're leaving a lot on the table.", createdAt: mins(1320), isRead: true },
      { conversationId: conv4Id, senderId: rohan._id, receiverId: ananya._id, content: "Absolutely — I do a free 30-minute audit call for all new clients. I can spot obvious issues just from the ad account structure. Let's book something this week?", createdAt: mins(60), isRead: false },

      // Conv 5 – Suresh ↔ Sanjay
      { conversationId: conv5Id, senderId: suresh._id, receiverId: sanjay._id, content: "Hello Sanjay, we liked your spice brand catalogue samples. Our brief: 60 SKUs — individual packs, combo hampers, and 20 lifestyle shots. Studio is set up in Kochi. When can you visit for a test shoot?", createdAt: mins(2160), isRead: true },
      { conversationId: conv5Id, senderId: sanjay._id, receiverId: suresh._id, content: "Hi Suresh! Sounds like a great project. I can fly to Kochi next week — Wednesday or Thursday work. For the test shoot I'd suggest 5 products: 3 individual packs and 2 lifestyle setups.", createdAt: mins(2100), isRead: true },
      { conversationId: conv5Id, senderId: suresh._id, receiverId: sanjay._id, content: "Thursday works well. I'll arrange airport pickup. Can you send a checklist of what you'll need at the studio? Lighting, backdrops, props, etc.", createdAt: mins(1440), isRead: true },
      { conversationId: conv5Id, senderId: sanjay._id, receiverId: suresh._id, content: "Will do! Sending a full technical rider by tonight. Main requirements: 3m x 3m white seamless backdrop, 2 power outlets, and a large table. I'll bring all lighting (3-point LED setup + reflectors).", createdAt: mins(1380), isRead: true },
      { conversationId: conv5Id, senderId: suresh._id, receiverId: sanjay._id, content: "All arranged. Looking forward to Thursday! Our export packaging designer will also be present to ensure the shots align with EU labelling requirements.", createdAt: mins(120), isRead: false },
    ]);
    console.log('Created 30 messages across 5 conversations');

    console.log('\nSeed complete! Summary:');
    console.log('  Users:              13 (5 clients + 8 freelancers)');
    console.log('  Freelancer Profiles: 8');
    console.log('  Jobs:               10 (2 in-progress, 1 completed, 7 open)');
    console.log('  Proposals:          6');
    console.log('  Contracts:          3 (2 active, 1 completed)');
    console.log('  Reviews:            4');
    console.log('  Messages:           30 across 5 conversations');
    console.log('\nTest logins (password: password123):');
    console.log('  CLIENT:     rajesh@example.com');
    console.log('  CLIENT:     kavya@example.com');
    console.log('  FREELANCER: priya@example.com');
    console.log('  FREELANCER: arjun@example.com');
    console.log('  FREELANCER: meera@example.com');
    console.log('  FREELANCER: neha@example.com');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
