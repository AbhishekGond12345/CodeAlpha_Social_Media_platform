import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    supabaseId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true, maxlength: 40 },
    bio: { type: String, default: '', maxlength: 160 },
    avatarUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
