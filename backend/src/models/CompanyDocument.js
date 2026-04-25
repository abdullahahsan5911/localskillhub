import mongoose from 'mongoose';

const companyDocumentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    fileName: String,
    fileUrl: String,
    mimeType: String,
    fileSize: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminComment: String,
    rejectionReason: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const CompanyDocument = mongoose.model('CompanyDocument', companyDocumentSchema);

export default CompanyDocument;
