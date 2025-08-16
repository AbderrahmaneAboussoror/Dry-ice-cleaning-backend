import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../utils/auth';
import User from '../models/User';

interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = verifyToken(token) as jwt.JwtPayload;

        if (!decoded.userId) {
            res.status(401).json({ error: 'Invalid token format' });
            return;
        }

        const user = await User.findById(decoded.userId).select('-password');
        if (!user || !user.isActive) {
            res.status(401).json({ error: 'User not found or inactive' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
        } else if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
        } else {
            res.status(401).json({ error: 'Authentication failed' });
        }
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
};

/**
 * Admin authorization middleware
 * Checks if the authenticated user has admin role
 * Must be used after the authenticate middleware
 */
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }

        if (req.user.role === 'admin') {
            next();
            return;
        }

        res.status(403).json({
            success: false,
            message: 'Admin access required. You do not have permission to access this resource.'
        });
    } catch (error) {
        console.error('Admin authorization error:', error);
        res.status(500).json({
            success: false,
            message: 'Authorization check failed'
        });
    }
};