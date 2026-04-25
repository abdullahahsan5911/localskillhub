import VerificationRequest from '../models/VerificationRequest.js';
import User from '../models/User.js';

/**
 * Auto-approve verified badge applications that haven't been reviewed within 24 hours
 * Runs periodically (e.g., every hour)
 */
export const autoApproveVerifications = async () => {
  try {
    const now = new Date();

    // Find all pending verified_badge applications that should have been auto-approved
    const expiredApplications = await VerificationRequest.find({
      type: 'verified_badge',
      status: 'pending',
      autoApproveAt: { $lte: now },
      autoApproved: false
    }).populate('userId');

    if (expiredApplications.length === 0) {
      console.log('✓ No expired verifications to auto-approve');
      return;
    }

    console.log(`⏳ Processing ${expiredApplications.length} expired verification applications...`);

    for (const vr of expiredApplications) {
      try {
        // Mark as approved and auto-approved
        await VerificationRequest.findByIdAndUpdate(
          vr._id,
          {
            status: 'approved',
            autoApproved: true,
            reviewedAt: new Date(),
            reviewedBy: null // System auto-approval, no admin user
          }
        );

        // Add verified badge to user
        if (vr.userId) {
          await User.findByIdAndUpdate(vr.userId._id, {
            $push: {
              verifiedBadges: {
                type: 'verified',
                verifiedAt: new Date(),
                verifiedBy: 'system',
                autoApproved: true
              }
            }
          });

          console.log(`✓ Auto-approved verification for user: ${vr.userId.name} (${vr.userId.email})`);
        }
      } catch (err) {
        console.error(`✗ Failed to auto-approve verification ${vr._id}:`, err.message);
      }
    }

    console.log(`✓ Auto-approval job completed. Processed ${expiredApplications.length} applications.`);
  } catch (error) {
    console.error('✗ Error in auto-approve verifications job:', error);
  }
};

export default autoApproveVerifications;
