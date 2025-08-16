import express from 'express';
import cors from 'cors';
import { setupMiddlewares } from "./middlewares/setupMiddlewares";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import swaggerUi from 'swagger-ui-express';
import { specs } from "./config/swagger";
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import packRoutes from "./routes/packRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import adminRoutes from "./routes/adminRoutes";
import contactRoutes from "./routes/contactRoutes";

// Initializing environment variables
const app = express();

app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

// JSON parsing for other routes
app.use(express.json());

// Setting up the necessary middlewares
setupMiddlewares(app);

app.use(cors({
    origin: true,
    credentials: true
}));

// Swagger Documentation
if (process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV === 'development') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'GlaciX API Documentation'
    }));

    // Redirect root to API docs only if Swagger is enabled
    app.get('/', (req, res) => {
        res.redirect('/api-docs');
    });

    console.log('📚 Swagger documentation available at /api-docs');
} else {
    // Basic root route when Swagger is disabled
    app.get('/', (req, res) => {
        res.json({ message: 'GlaciX API', version: '1.0.0' });
    });
}

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/packs', packRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/contact', contactRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use('/', notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;