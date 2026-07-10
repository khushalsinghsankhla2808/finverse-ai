import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestmentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  assetType: 'stocks' | 'mutual_funds' | 'gold' | 'crypto' | 'fixed_deposit' | 'other';
  symbol?: string;
  units: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: Date;
  platform?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // virtual fields type annotations
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

const InvestmentSchema = new Schema<IInvestmentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    assetType: {
      type: String,
      enum: ['stocks', 'mutual_funds', 'gold', 'crypto', 'fixed_deposit', 'other'],
      required: true,
    },
    symbol: { type: String, trim: true },
    units: { type: Number, default: 1 },
    purchasePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    purchaseDate: { type: Date, required: true },
    platform: { type: String, trim: true },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: totalInvested = units * purchasePrice
InvestmentSchema.virtual('totalInvested').get(function (this: IInvestmentDocument) {
  return this.units * this.purchasePrice;
});

// Virtual: currentValue = units * currentPrice
InvestmentSchema.virtual('currentValue').get(function (this: IInvestmentDocument) {
  return this.units * this.currentPrice;
});

// Virtual: gainLoss = currentValue - totalInvested
InvestmentSchema.virtual('gainLoss').get(function (this: IInvestmentDocument) {
  const total = this.units * this.purchasePrice;
  const current = this.units * this.currentPrice;
  return current - total;
});

// Virtual: gainLossPercent = (gainLoss / totalInvested) * 100
InvestmentSchema.virtual('gainLossPercent').get(function (this: IInvestmentDocument) {
  const total = this.units * this.purchasePrice;
  const current = this.units * this.currentPrice;
  if (total === 0) return 0;
  return ((current - total) / total) * 100;
});

export const InvestmentModel = mongoose.model<IInvestmentDocument>('Investment', InvestmentSchema);
export default InvestmentModel;
