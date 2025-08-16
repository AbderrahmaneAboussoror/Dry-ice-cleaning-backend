import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Dry Ice Cleaning API',
            version: '1.0.0',
            description: 'API for dry ice cleaning services management',
            contact: {
                name: 'API Support',
                email: 'support@dryicecleaning.com'
            }
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://your-domain.com/api'
                    : `http://localhost:${process.env.PORT || 3000}`,
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: [
        './routes/*.ts',
        './controllers/*.ts'
    ]
};

export const specs = swaggerJsdoc(options);