import mongoose, { Schema, Document } from 'mongoose';

export interface IAIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IAIHistoryDocument extends Document {
  userId: mongoose.Types.ObjectId;
  messages: IAIMessage[];
  sessionTitle: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIMessageSchema = new Schema<IAIMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const AIHistorySchema = new Schema<IAIHistoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [AIMessageSchema],
    sessionTitle: { type: String, default: 'New Chat' },
  },
  {
    timestamps: true,
  }
);

export const AIHistoryModel = mongoose.model<IAIHistoryDocument>('AIHistory', AIHistorySchema);
export default AIHistoryModel;
