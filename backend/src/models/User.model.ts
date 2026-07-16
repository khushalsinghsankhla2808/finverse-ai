import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password?: string;
  firebaseUid?: string | null;
  avatar: string | null;
  plan: 'free' | 'premium';
  currency: string;
  language: string;
  theme: 'dark' | 'light';
  refreshToken: string | null;
  isEmailVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 8,
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    language: {
      type: String,
      default: 'en',
    },
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark',
    },
    refreshToken: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
export default UserModel;