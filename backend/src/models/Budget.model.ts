import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetDocument extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly';
  color: string;
  icon: string;
  alertThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudgetDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true, trim: true },
    limit: { type: Number, required: true, min: 1 },
    spent: { type: Number, default: 0 },
    period: { type: String, enum: ['monthly', 'weekly'], default: 'monthly' },
    color: { type: String, default: '#7C3AED' },
    icon: { type: String, default: '💰' },
    alertThreshold: { type: Number, default: 80, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

export const BudgetModel = mongoose.model<IBudgetDocument>('Budget', BudgetSchema);
export default BudgetModel;
