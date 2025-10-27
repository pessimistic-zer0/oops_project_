import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    roomNumber: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin', 'worker'], required: true, index: true }
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);
export default User;