import type { Request, Response, NextFunction } from 'express';

/**
 * Core permission middleware - check if user has any of the allowed roles
 * @param allowedRoles - Array of role names (case-insensitive)
 * @returns Middleware function
 */
export function requirePermission(
    allowedRoles: string[]
): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const userRoles = (req.user.roles || []).map(r => r.toLowerCase());
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());
        
        console.log(`[requirePermission] User roles:`, req.user.roles);
        console.log(`[requirePermission] Allowed roles:`, allowedRoles);
        
        const hasPermission = userRoles.some(role => normalizedAllowedRoles.includes(role));
        
        if (!hasPermission) {
            console.log(`[requirePermission] Access denied`);
            res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
            });
            return;
        }

        next();
    };
}

/**
 * Middleware to check if user has specific role(s)
 * @param roles - Array of role names (case-insensitive)
 * @returns Middleware function
 * 
 * @example
 * // Require 'manager' role
 * router.post('/', authenticateToken, requireRole(['manager']), ...);
 * 
 * // Require either 'admin' or 'manager' role
 * router.post('/', authenticateToken, requireRole(['admin', 'manager']), ...);
 */
export function requireRole(roles: string[]) {
    return requirePermission(roles);
}

