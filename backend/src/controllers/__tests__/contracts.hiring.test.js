import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const ContractMock = {
  create: jest.fn(),
  findById: jest.fn(),
};

const UserMock = {
  findById: jest.fn(),
  find: jest.fn(),
};

const CompanyMock = {
  findById: jest.fn(),
};

const AdminNotificationMock = {
  create: jest.fn(),
};

const PlatformSettingsMock = {
  findOne: jest.fn(),
};

const stripeMock = {
  paymentIntents: {
    create: jest.fn(),
  },
};

jest.unstable_mockModule('../../models/Contract.js', () => ({ default: ContractMock }));
jest.unstable_mockModule('../../models/Job.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/Proposal.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/User.js', () => ({ default: UserMock }));
jest.unstable_mockModule('../../models/Company.js', () => ({ default: CompanyMock }));
jest.unstable_mockModule('../../models/Transaction.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/PlatformSettings.js', () => ({ default: PlatformSettingsMock }));
jest.unstable_mockModule('../../models/FreelancerProfile.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/Dispute.js', () => ({ default: {} }));
jest.unstable_mockModule('../../models/AdminNotification.js', () => ({ default: AdminNotificationMock }));
jest.unstable_mockModule('../../services/reputation.service.js', () => ({ default: {} }));
jest.unstable_mockModule('../../config/stripe.js', () => ({ default: stripeMock }));
jest.unstable_mockModule('../../config/currency.js', () => ({ getStripeCurrency: () => 'usd' }));
jest.unstable_mockModule('../../middleware/errorHandler.js', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

const {
  createHiringRequest,
  respondToHiringRequest,
  createContractPaymentIntent,
} = await import('../contracts.js');

const makeReqResNext = (overrides = {}) => {
  const io = {
    to: jest.fn(() => ({ emit: jest.fn() })),
  };

  const req = {
    user: {
      _id: 'client-1',
      id: 'client-1',
      role: 'client',
      name: 'Client One',
    },
    body: {},
    params: {},
    app: {
      get: jest.fn(() => io),
    },
    ...overrides,
  };

  const res = {
    status: jest.fn(function status() {
      return this;
    }),
    json: jest.fn(),
  };

  const next = jest.fn();

  return { req, res, next };
};

describe('contracts hiring request lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a hiring request and emits notifications to freelancer/client/admin', async () => {
    const createdContract = {
      _id: 'contract-1',
      title: 'Website redesign',
    };

    ContractMock.create.mockResolvedValue(createdContract);
    UserMock.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'freelancer-1', role: 'freelancer', name: 'Freelancer One' }),
    });
    UserMock.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'admin-1' }]),
    });

    const { req, res, next } = makeReqResNext({
      body: {
        freelancerId: 'freelancer-1',
        title: 'Website redesign',
        amount: { total: 1000, type: 'fixed', currency: 'USD' },
        milestones: [{ title: 'Phase 1', amount: 1000 }],
        hiringType: 'individual',
      },
    });

    await createHiringRequest(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(ContractMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        freelancerId: 'freelancer-1',
        clientId: 'client-1',
        isHiringRequest: true,
        offerStatus: 'pending_freelancer',
      })
    );
    expect(AdminNotificationMock.create).toHaveBeenCalledTimes(3);
    expect(AdminNotificationMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'freelancer-1',
        type: 'hire_request_sent',
        contractId: 'contract-1',
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { contract: createdContract },
    });
  });

  it('allows freelancer to accept hiring request and sends accepted notifications', async () => {
    const contractDoc = {
      _id: 'contract-2',
      title: 'Logo package',
      clientId: { _id: 'client-2', name: 'Client Two' },
      freelancerId: { _id: 'freelancer-2', name: 'Freelancer Two', toString: () => 'freelancer-2' },
      offerStatus: 'pending_freelancer',
      status: 'draft',
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockImplementation(() => Promise.resolve(contractDoc)),
    };

    ContractMock.findById.mockResolvedValue(contractDoc);
    UserMock.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'admin-1' }]),
    });

    const { req, res, next } = makeReqResNext({
      user: {
        _id: 'freelancer-2',
        id: 'freelancer-2',
        role: 'freelancer',
      },
      params: { id: 'contract-2' },
      body: { action: 'accept' },
    });

    await respondToHiringRequest(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(contractDoc.offerStatus).toBe('accepted');
    expect(contractDoc.save).toHaveBeenCalled();
    expect(AdminNotificationMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'hire_request_accepted', contractId: 'contract-2' })
    );
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      data: { contract: contractDoc },
    });
  });

  it('blocks escrow payment intent while hiring request is pending freelancer acceptance', async () => {
    PlatformSettingsMock.findOne.mockResolvedValue(null);

    const query = {
      populate: jest.fn().mockReturnThis(),
      clientId: { _id: { toString: () => 'client-1' } },
      freelancerId: { _id: { toString: () => 'freelancer-3' } },
      offerStatus: 'pending_freelancer',
      paymentStatus: 'pending',
      amount: { total: 800, currency: 'USD' },
    };

    ContractMock.findById.mockReturnValue(query);

    const { req, res, next } = makeReqResNext({
      params: { id: 'contract-3' },
      user: {
        _id: 'client-1',
        id: 'client-1',
        role: 'client',
      },
    });

    await createContractPaymentIntent(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.message).toContain('Freelancer must accept the hiring request before payment');
    expect(err.statusCode).toBe(400);
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
