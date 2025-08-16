import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import mongoose from 'mongoose';
import {initializeEmailSystem} from "./utils/emailUtils";

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI!;

// Initialize email system when starting the app
const startServer = async () => {
    await initializeEmailSystem();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected')
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`)
        })
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err)
    });
