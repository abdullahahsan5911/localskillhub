import { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiShield, FiCamera, FiLinkedin, FiGithub, FiCheckCircle, FiClock } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface VerificationStatus {
  verificationLevel: string;
  verificationScore: number;
  verifications: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    biometric: boolean;
    linkedin: boolean;
    github: boolean;
    education: boolean;
    employment: boolean;
  };
  trustBadges: Array<{
    type: string;
    earnedAt: string;
  }>;
}

const VerificationDashboard = () => {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    verificationLevel: 'unverified',
    verificationScore: 0,
    verifications: {
      email: false,
      phone: false,
      identity: false,
      biometric: false,
      linkedin: false,
      github: false,
      education: false,
      employment: false,
    },
    trustBadges: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await api.getVerificationStatus();
      if (response.data) {
        setVerificationStatus(response.data as any);
      }
    } catch (error) {
      console.error('Failed to fetch verification status:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailVerification = async () => {
    try {
      setActiveStep('email');
      await api.sendEmailVerification();
      alert('Verification email sent! Please check your inbox.');
    } catch (error) {
      alert('Failed to send verification email');
    } finally {
      setActiveStep(null);
    }
  };

  const handleSendPhoneOTP = async () => {
    try {
      if (!phoneNumber) {
        alert('Please enter phone number');
        return;
      }
      setActiveStep('phone');
      await api.sendPhoneOTP(phoneNumber);
      setOtpSent(true);
      alert('OTP sent to your phone');
    } catch (error) {
      alert('Failed to send OTP');
    } finally {
      setActiveStep(null);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    try {
      if (!otp) {
        alert('Please enter OTP');
        return;
      }
      setActiveStep('phone');
      await api.verifyPhoneOTP(phoneNumber, otp);
      alert('Phone verified successfully!');
      setOtpSent(false);
      setOtp('');
      setPhoneNumber('');
      fetchVerificationStatus();
    } catch (error) {
      alert('Invalid OTP');
    } finally {
      setActiveStep(null);
    }
  };

  const handleConnectLinkedIn = () => {
    // TODO: Implement LinkedIn OAuth
    alert('LinkedIn integration coming soon!');
  };

  const handleConnectGitHub = () => {
    // TODO: Implement GitHub OAuth
    alert('GitHub integration coming soon!');
  };

  const getVerificationLevelColor = (level: string) => {
    switch (level) {
      case 'premium': return 'bg-purple-100 text-purple-700';
      case 'advanced': return 'bg-blue-100 text-blue-700';
      case 'standard': return 'bg-green-100 text-green-700';
      case 'basic': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getVerificationIcon = (verified: boolean) => {
    return verified ? (
      <FiCheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <FiClock className="h-5 w-5 text-gray-400" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const verifications = verificationStatus.verifications;
  const progressPercentage = verificationStatus.verificationScore;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">Verification Center</h1>
          <p className="text-lg text-gray-600">Build trust and unlock premium features by verifying your identity and skills.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getVerificationLevelColor(verificationStatus.verificationLevel) + ' text-base px-4 py-2 font-semibold'}>
            {verificationStatus.verificationLevel.toUpperCase()}
          </Badge>
          <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-10">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 shadow-md"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Email */}
        <Card className="p-7 flex flex-col items-center text-center shadow-xl border-2 border-blue-100 bg-white hover:shadow-2xl transition-shadow">
          <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-blue-50">
            <FiMail className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">Email Verification</h3>
          <p className="text-sm text-gray-500 mb-2">+10 points</p>
          {getVerificationIcon(verifications.email)}
          {!verifications.email && (
            <Button 
              onClick={handleSendEmailVerification}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 font-semibold"
              disabled={activeStep === 'email'}
            >
              Send Verification Email
            </Button>
          )}
          {verifications.email && (
            <div className="text-center text-sm text-green-600 font-medium mt-2">
              ✓ Email Verified
            </div>
          )}
        </Card>

        {/* Phone */}
        <Card className="p-7 flex flex-col items-center text-center shadow-xl border-2 border-green-100 bg-white hover:shadow-2xl transition-shadow">
          <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-green-50">
            <FiPhone className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">Phone Verification</h3>
          <p className="text-sm text-gray-500 mb-2">+10 points</p>
          {getVerificationIcon(verifications.phone)}
          {!verifications.phone && (
            <div className="space-y-3 w-full">
              {!otpSent ? (
                <>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button 
                    onClick={handleSendPhoneOTP}
                    className="w-full bg-green-600 hover:bg-green-700 font-semibold"
                  >
                    Send OTP
                  </Button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button 
                    onClick={handleVerifyPhoneOTP}
                    className="w-full bg-green-600 hover:bg-green-700 font-semibold"
                  >
                    Verify OTP
                  </Button>
                </>
              )}
            </div>
          )}
          {verifications.phone && (
            <div className="text-center text-sm text-green-600 font-medium mt-2">
              ✓ Phone Verified
            </div>
          )}
        </Card>

        {/* ID Verification */}
        <Card className="p-7 flex flex-col items-center text-center shadow-xl border-2 border-purple-100 bg-white hover:shadow-2xl transition-shadow">
          <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-purple-50">
            <FiShield className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">ID Verification</h3>
          <p className="text-sm text-gray-500 mb-2">+25 points</p>
          {getVerificationIcon(verifications.identity)}
          <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 font-semibold">
            Upload ID Document
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Passport, Driver's License, or National ID
          </p>
        </Card>

        {/* Selfie Verification */}
        <Card className="p-7 flex flex-col items-center text-center shadow-xl border-2 border-pink-100 bg-white hover:shadow-2xl transition-shadow">
          <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-pink-50">
            <FiCamera className="h-8 w-8 text-pink-600" />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">Selfie Verification</h3>
          <p className="text-sm text-gray-500 mb-2">+15 points</p>
          {getVerificationIcon(verifications.biometric)}
          <Button className="w-full mt-4 bg-pink-600 hover:bg-pink-700 font-semibold">
            Take Selfie
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Face match with ID document
          </p>
        </Card>

        {/* LinkedIn */}
        <Card className="p-7 flex flex-col items-center text-center shadow-xl border-2 border-blue-200 bg-white hover:shadow-2xl transition-shadow">
          <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-blue-50">
            <FiLinkedin className="h-8 w-8 text-blue-700" />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">LinkedIn Profile</h3>
          <p className="text-sm text-gray-500 mb-2">+7 points</p>
          {getVerificationIcon(verifications.linkedin)}
          <Button 
            onClick={handleConnectLinkedIn}
            className="w-full mt-4 bg-blue-700 hover:bg-blue-800 font-semibold"
            disabled={verifications.linkedin}
          >
            {verifications.linkedin ? '✓ Connected' : 'Connect LinkedIn'}
          </Button>
        </Card>

        {/* GitHub */}
        <Card className="p-7 flex flex-col items-center text-center shadow-xl border-2 border-gray-200 bg-white hover:shadow-2xl transition-shadow">
          <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gray-50">
            <FiGithub className="h-8 w-8 text-gray-900" />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">GitHub Profile</h3>
          <p className="text-sm text-gray-500 mb-2">+7 points</p>
          {getVerificationIcon(verifications.github)}
          <Button 
            onClick={handleConnectGitHub}
            className="w-full mt-4 bg-gray-900 hover:bg-gray-800 font-semibold"
            disabled={verifications.github}
          >
            {verifications.github ? '✓ Connected' : 'Connect GitHub'}
          </Button>
        </Card>
      </div>

      {/* Trust Badges */}
      {verificationStatus?.trustBadges && verificationStatus.trustBadges.length > 0 && (
        <Card className="p-7 mt-12 shadow-xl border-2 border-blue-100 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Earned Badges</h2>
          <div className="flex flex-wrap gap-3">
            {verificationStatus.trustBadges.map((badge, index) => (
              <Badge key={index} className="bg-blue-100 text-blue-700 px-4 py-2 text-base font-semibold">
                {badge.type.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default VerificationDashboard;
