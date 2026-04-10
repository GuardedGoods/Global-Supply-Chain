import { Router, Request, Response } from 'express';
import { EventEmitter } from 'events';
import { SSEMessage } from '../../../shared/types/api';

export const sseRouter = Router();

// Event emitter for data updates - the scheduler will import and emit on this
export const dataEvents = new EventEmitter();

// Track connected SSE clients
const clients = new Set<Response>();

sseRouter.get('/', (req: Request, res: Response) => {
  try {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Disable response buffering
    res.flushHeaders();

    // Add client to tracked set
    clients.add(res);
    console.log(`SSE client connected. Total clients: ${clients.size}`);

    // Send initial connection confirmation
    const connectMessage: SSEMessage = {
      type: 'heartbeat',
      data: { message: 'Connected to supply chain data stream' },
      timestamp: new Date().toISOString(),
    };
    res.write(`data: ${JSON.stringify(connectMessage)}\n\n`);

    // Set up heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      const heartbeat: SSEMessage = {
        type: 'heartbeat',
        data: { message: 'keepalive' },
        timestamp: new Date().toISOString(),
      };
      res.write(`data: ${JSON.stringify(heartbeat)}\n\n`);
    }, 30000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      clients.delete(res);
      console.log(`SSE client disconnected. Total clients: ${clients.size}`);
    });
  } catch (error) {
    console.error('Error establishing SSE connection:', error);
    clients.delete(res);
  }
});

// Broadcast a message to all connected SSE clients
function broadcast(message: SSEMessage): void {
  const payload = `data: ${JSON.stringify(message)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (error) {
      console.error('Error writing to SSE client, removing:', error);
      clients.delete(client);
    }
  }
}

// Listen for data-updated events from the scheduler
dataEvents.on('data-updated', (eventData: { type: SSEMessage['type']; data: unknown }) => {
  const message: SSEMessage = {
    type: eventData.type,
    data: eventData.data,
    timestamp: new Date().toISOString(),
  };
  broadcast(message);
});

export { broadcast, clients };
