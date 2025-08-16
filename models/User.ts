import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    address: string;
    totalPoints: number;
    createdAt: Date;
    updatedAt: Date;
    role: string;
    isActive: boolean;
    resetPasswordToken?: string;
    resetPasswordExpiry?: Date;
}

const userSchema = new Schema<IUser>(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        phoneNumber: { type: String, required: true, trim: true },
        password: { type: String, required: true, minlength: 6 },
        address: { type: String, required: true, trim: true },
        totalPoints: { type: Number, default: 0, min: 0 },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        isActive: { type: Boolean, default: true },
        resetPasswordToken: { type: String },
        resetPasswordExpiry: { type: Date }
    },
    { timestamps: true }
);

userSchema.index({ email: 1 });

export default model<IUser>('User', userSchema);
