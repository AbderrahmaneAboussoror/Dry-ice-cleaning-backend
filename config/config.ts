export const config = {
    // Email configuration
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        user: process.env.EMAIL_USER || '', // Your email address
        password: process.env.EMAIL_PASSWORD || '', // Your email password or app password
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@cleancar.com'
    },

    // Frontend URL for email links
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};