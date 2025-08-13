import { Options } from 'swagger-jsdoc';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chat Backend API',
      version: '1.0.0',
      description: 'Real-time chat application backend API with WebSocket support'
    },
    servers: [
      {
        url: 'http://localhost:{$PORT}',
        description: 'WebSocketServer'
      }
    ],
  },
  apis: [
  './src/documents/webSocketDocs.ts'
]
};