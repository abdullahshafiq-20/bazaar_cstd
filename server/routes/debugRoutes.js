// filepath: d:\All_Repos_by_as053266\bazaar_cstd\server\routes\debugRoutes.js
import express from 'express';
import messageProducer from '../services/messageProducer.js';

const debudRouter = express.Router();

// Route to manually publish test messages
debudRouter.post('/test-message', async (req, res) => {
  try {
    const { exchange, routingKey, message } = req.body;
    
    if (!exchange || !routingKey || !message) {
      return res.status(400).json({
        success: false,
        message: 'Exchange, routingKey and message are required'
      });
    }
    
    await messageProducer.publishEvent(exchange, routingKey, message);
    
    res.status(200).json({
      success: true,
      message: `Test message published to ${exchange}.${routingKey}`,
      data: message
    });
  } catch (error) {
    console.error('Error publishing test message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish test message'
    });
  }
});

export default debudRouter;