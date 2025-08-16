import { Schema, model, Document, Types } from 'mongoose';

export interface IPack extends Document {
    name: string;
    description: string;
    priceInDKK: number;
    pointsIncluded: number;
    bonusPoints: number;
    freeServices: {
        serviceType: 'basic' | 'deluxe';
        quantity: number;
    }[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    totalPoints: number; // Virtual property
    totalValue: number; // Virtual property
}

const packSchema = new Schema<IPack>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        priceInDKK: {
            type: Number,
            required: true,
            min: 0
        },
        pointsIncluded: {
            type: Number,
            required: true,
            min: 0
        },
        bonusPoints: {
            type: Number,
            default: 0,
            min: 0
        },
        freeServices: [{
            serviceType: {
                type: String,
                enum: ['basic', 'deluxe'],
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Virtual for total points
packSchema.virtual('totalPoints').get(function() {
    return this.pointsIncluded + this.bonusPoints;
});

// Virtual for total value
packSchema.virtual('totalValue').get(function() {
    let serviceValue = 0;
    this.freeServices.forEach(service => {
        const servicePrice = service.serviceType === 'basic' ? 1000 : 1400;
        serviceValue += servicePrice * service.quantity;
    });
    return this.totalPoints + serviceValue;
});

export default model<IPack>('Pack', packSchema);
