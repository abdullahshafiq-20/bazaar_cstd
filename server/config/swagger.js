import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define base path based on environment
const getBasePath = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.API_URL || '';
  }
  return 'http://localhost:3000';
};

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Bazaar CSTD API',
    version: '1.0.0',
    description: 'API documentation for Bazaar CSTD application',
    contact: {
      name: 'Support'
    }
  },
  servers: [
    {
      url: getBasePath(),
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
};

// For debugging - log the current working directory
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);

// Try different API path configurations
let apiPaths;

if (process.env.NODE_ENV === 'production') {
  // In production (Vercel), use relative paths
  apiPaths = ['./controllers/*.js', './routes/*.js'];
} else {
  // In development, use absolute paths
  apiPaths = [
    path.join(__dirname, '../middleware/*.js'),
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../routes/*.js')
    
  ];
}

console.log('API Paths:', apiPaths);

const options = {
  swaggerDefinition,
  apis: apiPaths
};

// Create swagger spec and log for debugging
const swaggerSpec = swaggerJSDoc(options);
console.log('Swagger detected paths:', Object.keys(swaggerSpec.paths || {}).length);
console.log('Swagger detected schemas:', Object.keys(swaggerSpec.components?.schemas || {}).length);

export const setupSwagger = (app) => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Bazaar API',
        version: '2',
        description: 'Bazaar API documentation',
      },
      tags: [
        {
          name: 'Rate Limiting',
          description: 'Endpoints for managing API rate limits'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  };

  // Always serve swagger docs, but log differently based on environment
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  if (process.env.NODE_ENV === 'production') {
    console.log('Swagger UI available at production URL /api-docs');
  } else {
    console.log('Swagger UI available at: http://localhost:3000/api-docs');
  }
  
  // Add a route to get the raw swagger specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  // Add debug endpoint to help troubleshoot swagger issues
  app.get('/api-docs-debug', (req, res) => {
    res.json({
      environment: process.env.NODE_ENV || 'development',
      cwd: process.cwd(),
      dirname: __dirname,
      apiPaths: apiPaths,
      detectedPaths: Object.keys(swaggerSpec.paths || {}),
      detectedSchemas: Object.keys(swaggerSpec.components?.schemas || {}),
      serverUrl: swaggerSpec.servers[0].url
    });
  });
};

// Default export for Vercel serverless function
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(swaggerSpec);
}