import { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiShield, FiCamera, FiLinkedin, FiGithub, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Identity Verification</h1>
        <p className="text-gray-600">Complete verifications to build trust and unlock features</p>
      </div>

      {/* Progress Overview */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Verification Progress</h2>
            <p className="text-sm text-gray-600">Level: <Badge className={getVerificationLevelColor(verificationStatus.verificationLevel)}>{verificationStatus.verificationLevel.toUpperCase()}</Badge></p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{progressPercentage}%</div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </Card>

      {/* Verification Steps */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Email Verification */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FiMail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email Verification</h3>
                <p className="text-sm text-gray-600">+10 points</p>
              </div>
            </div>
            {getVerificationIcon(verifications.email)}
          </div>
          {!verifications.email && (
            <Button 
              onClick={handleSendEmailVerification}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={activeStep === 'email'}
            >
              Send Verification Email
            </Button>
          )}
          {verifications.email && (
            <div className="text-center text-sm text-green-600 font-medium">
              ✓ Email Verified
            </div>
          )}
        </Card>

        {/* Phone Verification */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <FiPhone className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Phone Verification</h3>
                <p className="text-sm text-gray-600">+10 points</p>
              </div>
            </div>
            {getVerificationIcon(verifications.phone)}
          </div>
          {!verifications.phone && (
            <div className="space-y-3">
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
                    className="w-full bg-green-600 hover:bg-green-700"
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
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Verify OTP
                  </Button>
                </>
              )}
            </div>
          )}
          {verifications.phone && (
            <div className="text-center text-sm text-green-600 font-medium">
              ✓ Phone Verified
            </div>
          )}
        </Card>

        {/* ID Verification */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <FiShield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ID Verification</h3>
                <p className="text-sm text-gray-600">+25 points</p>
              </div>
            </div>
            {getVerificationIcon(verifications.identity)}
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Upload ID Document
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Passport, Driver's License, or National ID
          </p>
        </Card>

        {/* Selfie Verification */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-50 rounded-lg">
                <FiCamera className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Selfie Verification</h3>
                <p className="text-sm text-gray-600">+15 points</p>
              </div>
            </div>
            {getVerificationIcon(verifications.biometric)}
          </div>
          <Button className="w-full bg-pink-600 hover:bg-pink-700">
            Take Selfie
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Face match with ID document
          </p>
        </Card>

        {/* LinkedIn Connection */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FiLinkedin className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">LinkedIn Profile</h3>
                <p className="text-sm text-gray-600">+7 points</p>
              </div>
            </div>
            {getVerificationIcon(verifications.linkedin)}
          </div>
          <Button 
            onClick={handleConnectLinkedIn}
            className="w-full bg-blue-700 hover:bg-blue-800"
            disabled={verifications.linkedin}
          >
            {verifications.linkedin ? '✓ Connected' : 'Connect LinkedIn'}
          </Button>
        </Card>

        {/* GitHub Connection */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <FiGithub className="h-6 w-6 text-gray-900" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">GitHub Profile</h3>
                <p className="text-sm text-gray-600">+7 points</p>
              </div>
            </div>
            {getVerificationIcon(verifications.github)}
          </div>
          <Button 
            onClick={handleConnectGitHub}
            className="w-full bg-gray-900 hover:bg-gray-800"
            disabled={verifications.github}
          >
            {verifications.github ? '✓ Connected' : 'Connect GitHub'}
          </Button>
        </Card>
      </div>

      {/* Trust Badges */}
      {verificationStatus?.trustBadges && verificationStatus.trustBadges.length > 0 && (
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Earned Badges</h2>
          <div className="flex flex-wrap gap-3">
            {verificationStatus.trustBadges.map((badge, index) => (
              <Badge key={index} className="bg-blue-100 text-blue-700 px-4 py-2 text-sm">
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
