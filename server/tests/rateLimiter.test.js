import request from 'supertest';
import app from '../app.js';
import fs from 'fs';
import path from 'path';

// Helper to get an auth token
async function getAuthToken(role = 'admin') {
  // Implement login to get token
  const response = await request(app)
    .post('/api/auth/login')
    .send({ 
      username: process.env.TEST_ADMIN_USERNAME || 'admin', 
      password: process.env.TEST_ADMIN_PASSWORD || 'admin' 
    });
  
  return response.body.token;
}

describe('Rate Limiter Tests', () => {
  let adminToken;
  
  beforeAll(async () => {
    adminToken = await getAuthToken();
  });

  test('Should allow requests under the limit', async () => {
    // Make a few requests that should be under the limit
    for (let i = 0; i < 5; i++) {
      const response = await request(app).get('/api/products');
      expect(response.status).not.toBe(429);
    }
  });

  test('Should block requests over the limit', async () => {
    // Make many requests to trigger rate limiting
    const responses = [];
    for (let i = 0; i < 150; i++) {
      responses.push(request(app).get('/api/products'));
    }
    
    const results = await Promise.all(responses);
    
    // At least some responses should be rate limited
    const rateLimited = results.some(res => res.status === 429);
    expect(rateLimited).toBe(true);
  });

  test('Should respect endpoint-specific limits', async () => {
    // Update rate limits for testing
    await request(app)
      .post('/api/admin/rate-limits/update')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({'/api/auth': 5})
      .expect(200);
      
    // Make requests to the specific endpoint
    const responses = [];
    for (let i = 0; i < 10; i++) {
      responses.push(request(app).post('/api/auth/login').send({
        username: 'test',
        password: 'test'
      }));
    }
    
    const results = await Promise.all(responses);
    
    // Some responses should be rate limited
    const rateLimited = results.some(res => res.status === 429);
    expect(rateLimited).toBe(true);
  });

  test('Should log throttled requests', async () => {
    // Trigger rate limiting
    const responses = [];
    for (let i = 0; i < 150; i++) {
      responses.push(request(app).get('/api/products'));
    }
    
    await Promise.all(responses);
    
    // Check if log file exists and has content
    const logPath = path.join(process.cwd(), 'throttled-requests.log');
    expect(fs.existsSync(logPath)).toBe(true);
    
    const logContent = fs.readFileSync(logPath, 'utf8');
    expect(logContent.length).toBeGreaterThan(0);
  });
});