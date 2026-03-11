import 'dotenv/config';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import Job from './src/models/Job.js';
import GeoLocationService from './src/services/geolocation.service.js';

const hasValidPoint = (location) => {
  const coords = location?.coordinates?.coordinates || location?.coordinates;
  return Array.isArray(coords) && coords.length >= 2 && Number.isFinite(Number(coords[0])) && Number.isFinite(Number(coords[1]));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const geocodeLocation = async (city, state, country = 'India') => {
  if (!city && !state) return null;
  const address = [city, state, country].filter(Boolean).join(', ');
  const result = await GeoLocationService.geocodeAddress(address);
  const latitude = Number(result.latitude);
  const longitude = Number(result.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    city: result.city || city || '',
    state: result.state || state || '',
    country: result.country || country || 'India',
    coordinates: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
  };
};

const backfillUsers = async () => {
  const users = await User.find({ isActive: true });
  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    if (hasValidPoint(user.location)) {
      skipped += 1;
      continue;
    }

    const resolved = await geocodeLocation(user.location?.city, user.location?.state, user.location?.country);
    if (!resolved) {
      console.log(`Skipping user ${user._id}: missing or unresolved location`);
      continue;
    }

    user.location = {
      ...user.location,
      city: resolved.city,
      state: resolved.state,
      country: resolved.country,
      coordinates: resolved.coordinates,
    };
    await user.save();
    updated += 1;
    console.log(`Updated user ${user._id} -> ${resolved.city}, ${resolved.state}`);
    await sleep(1100);
  }

  return { updated, skipped };
};

const backfillJobs = async () => {
  const jobs = await Job.find({});
  let updated = 0;
  let skipped = 0;

  for (const job of jobs) {
    if (hasValidPoint(job.location)) {
      skipped += 1;
      continue;
    }

    const resolved = await geocodeLocation(job.location?.city, job.location?.state, job.location?.country);
    if (!resolved) {
      console.log(`Skipping job ${job._id}: missing or unresolved location`);
      continue;
    }

    job.location = {
      ...job.location,
      city: resolved.city,
      state: resolved.state,
      country: resolved.country,
      coordinates: resolved.coordinates,
    };
    await job.save();
    updated += 1;
    console.log(`Updated job ${job._id} -> ${resolved.city}, ${resolved.state}`);
    await sleep(1100);
  }

  return { updated, skipped };
};

const main = async () => {
  await connectDB();

  try {
    const [users, jobs] = await Promise.all([backfillUsers(), backfillJobs()]);
    console.log('Backfill complete');
    console.log(`Users updated: ${users.updated}, skipped: ${users.skipped}`);
    console.log(`Jobs updated: ${jobs.updated}, skipped: ${jobs.skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  }
};

main();
