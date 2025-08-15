import { Request, Response, NextFunction } from 'express';

const ALLOWED_ORIGIN = process.env.CORS;

export function corsMiddleware(
    request: Request,
    response: Response,
    next: NextFunction
) {
    response.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    response.header('Access-Control-Allow-Methods', 'GET, POST');
    response.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}
