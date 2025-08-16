import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Pack from '../models/Pack';

const packs = [
    {
        name: 'Basic Pack',
        description: 'Perfect for getting started with our services',
        priceInDKK: 1000,
        pointsIncluded: 1000,
        bonusPoints: 0,
        freeServices: [],
        isActive: true
    },
    {
        name: 'Standard Pack',
        description: 'Great value with bonus points included',
        priceInDKK: 2800,
        pointsIncluded: 2800,
        bonusPoints: 500,
        freeServices: [],
        isActive: true
    },
    {
        name: 'Premium Pack',
        description: 'Best value with bonus points and free engine bay cleaning',
        priceInDKK: 5600,
        pointsIncluded: 5600,
        bonusPoints: 0,
        freeServices: [
            {
                serviceType: 'basic' as const,
                quantity: 1
            }
        ],
        isActive: true
    }
];

const seedPacks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);

        // Clear existing packs
        await Pack.deleteMany({});

        // Insert new packs
        const createdPacks = await Pack.insertMany(packs);

        console.log('✅ Packs seeded successfully:');
        createdPacks.forEach(pack => {
            console.log(`   - ${pack.name}: ${pack.priceInDKK} DKK -> ${pack.totalPoints} points`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding packs:', error);
        process.exit(1);
    }
};

seedPacks();