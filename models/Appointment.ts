import { Schema, model, Document, Types } from 'mongoose';

export interface IAppointment extends Document {
    userId: Types.ObjectId;
    serviceType: 'basic' | 'deluxe';
    appointmentDate: Date; // Just the date (YYYY-MM-DD)
    timeSlot: string; // System-assigned time like "14:00-16:00"
    startTime: Date; // Full datetime for the appointment start
    endTime: Date; // Full datetime for the appointment end
    location: string;
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    price: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        serviceType: {
            type: String,
            enum: ['basic', 'deluxe'],
            required: true
        },
        appointmentDate: { type: Date, required: true }, // Date only
        timeSlot: { type: String, required: true }, // "14:00-16:00"
        startTime: { type: Date, required: true }, // Full datetime
        endTime: { type: Date, required: true }, // Full datetime (startTime + 2 hours)
        location: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
            default: 'pending'
        },
        price: { type: Number, required: true, min: 0 },
        notes: { type: String, trim: true }
    },
    { timestamps: true }
);

// Prevent overlapping appointments - unique constraint on time slots
appointmentSchema.index({
    appointmentDate: 1,
    timeSlot: 1,
    status: 1
}, {
    unique: true,
    partialFilterExpression: {
        status: { $in: ['pending', 'confirmed', 'in_progress'] }
    }
});

// Index for finding user appointments
appointmentSchema.index({ userId: 1, appointmentDate: 1 });

export default model<IAppointment>('Appointment', appointmentSchema);
