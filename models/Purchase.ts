import { Schema, model, Document, Types } from 'mongoose';

export interface IPurchase extends Document {
    userId: Types.ObjectId;
    packId: Types.ObjectId;
    stripePaymentIntentId: string;
    stripeClientSecret?: string;
    amount: number; // Amount in DKK (smallest currency unit)
    currency: string;
    status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    pointsAwarded: number;
    bonusPointsAwarded: number;
    serviceCreditsAwarded: {
        serviceType: 'basic' | 'deluxe';
        quantity: number;
    }[];
    stripeMetadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        packId: {
            type: Schema.Types.ObjectId,
            ref: 'Pack',
            required: true
        },
        stripePaymentIntentId: {
            type: String,
            required: true,
            unique: true
        },
        stripeClientSecret: {
            type: String
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            required: true,
            default: 'dkk'
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled'],
            default: 'pending'
        },
        pointsAwarded: {
            type: Number,
            default: 0
        },
        bonusPointsAwarded: {
            type: Number,
            default: 0
        },
        serviceCreditsAwarded: [{
            serviceType: {
                type: String,
                enum: ['basic', 'deluxe']
            },
            quantity: {
                type: Number,
                min: 1
            }
        }],
        stripeMetadata: {
            type: Schema.Types.Mixed
        }
    },
    { timestamps: true }
);

// Index for finding user purchases
purchaseSchema.index({ userId: 1, createdAt: -1 });
// Index for Stripe webhooks
purchaseSchema.index({ stripePaymentIntentId: 1 });

export default model<IPurchase>('Purchase', purchaseSchema);