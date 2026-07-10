import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  merchant: string;
  category: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: Date;
  note: string;
  receiptUrl: string | null;
  tags: string[];
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    merchant: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
    date: { type: Date, required: true },
    note: { type: String, default: '' },
    receiptUrl: { type: String, default: null },
    tags: [{ type: String }],
    isRecurring: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ userId: 1, type: 1 });

export const TransactionModel = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);
export default TransactionModel;
