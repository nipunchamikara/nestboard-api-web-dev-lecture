import express, { type Express } from 'express'
import { healthRouter } from './routes/health.js';
import { propertiesRouter } from './routes/properties.js';

export function buildApp(): Express {
    const app = express();
    app.use(express.json());

    app.use('/api/health', healthRouter);
    app.use('/api/properties', propertiesRouter);

    app.get('/', (_req, res) => {
        res.send('Hello Nestboard')
    });

    return app;
}
