import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bazaar CSTD API V1',
    version: '1.0.0',
    description: 'API documentation for Bazaar CSTD application',
    contact: {
      name: 'Support'
    }
  }
};

const options = {
    swaggerDefinition,
    apis: [
      path.join(process.cwd(), 'controllers', '*.js'), // Use absolute path
      path.join(process.cwd(), 'routes', '*.js')
    ]
  };

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Serve swagger specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('Swagger docs available at /api-docs');
};