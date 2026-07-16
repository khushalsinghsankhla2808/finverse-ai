import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

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
  comparePassword(candidatePassword: string): Promise<boolean>;
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

// Pre-save hook to hash password
UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
export default UserModel;