import mongoose, { Schema, Document } from 'mongoose';

export interface IGoalDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
  color: string;
  icon: string;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoalDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date, required: true },
    category: { type: String, required: true, trim: true },
    color: { type: String, default: '#7C3AED' },
    icon: { type: String, default: '🎯' },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const GoalModel = mongoose.model<IGoalDocument>('Goal', GoalSchema);
export default GoalModel;
