import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
declare global {
    namespace Express {
        interface Request {
            validatedQuery?: Record<string, unknown>;
        }
    }
}
export declare const validate: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParams: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map