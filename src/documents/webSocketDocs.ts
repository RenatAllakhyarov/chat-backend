/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: Chat WebSocket API
 *   version: 1.0.0
 *   description: |
 *     Real-time chat communication protocol via WebSocket.
 *     
 *     ## Connection Flow:
 *     1. Client opens WebSocket connection to `ws://localhost:{$port}`
 *     2. Client sends INIT message with username
 *     3. Server responds with USER_DATA, USER_STATUS_CHANGED, HISTORY
 *     4. Real-time messaging begins
 *     
 *     ## Message Format:
 *     All messages are JSON objects with required `type` field.
 *     
 *     ## Client → Server Messages:
 *     - INIT: User authentication
 *     - TEXT: Text messages  
 *     - FILE: File messages
 *     
 *     ## Server → Client Messages:
 *     - MSG: New messages (text/file wrapper)
 *     - ERROR: Error notifications
 *     - USER_DATA: List of all users
 *     - USER_STATUS_CHANGED: User online/offline status
 *     - HISTORY: Recent message history
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     # ========================
 *     # Client → Server Messages
 *     # ========================
 *     
 *     InitMessage:
 *       type: object
 *       description: First message sent by client to establish identity
 *       properties:
 *         type:
 *           type: string
 *           enum: [init]
 *         username:
 *           type: string
 *         id:
 *           type: string
 *       required: [type, username, id]
 *     
 *     TextMessage:
 *       type: object
 *       description: Send text message
 *       properties:
 *         type:
 *           type: string
 *           enum: [text]
 *         text:
 *           type: string
 *           maxLength: 1000
 *       required: [type, text]
 *     
 *     FileMessage:
 *       type: object
 *       description: Send file message
 *       properties:
 *         type:
 *           type: string
 *           enum: [file]
 *         file:
 *           type: object
 *           properties:
 *             data:
 *               type: string
 *             name:
 *               type: string
 *             type:
 *               type: string
 *             size:
 *               type: number
 *           required: [data, name, type, size]
 *       required: [type, file]
 *     
 *     # ========================
 *     # Server → Client Messages
 *     # ========================
 *     
 *     ServerMessageWrapper:
 *       type: object
 *       description: |
 *         Wrapper for all server-sent messages.
 *         Provides consistent message structure for client-side processing.
 *         All server messages are wrapped in this format.
 *       properties:
 *         type:
 *           type: string
 *           enum: [msg]
 *         message:
 *           oneOf:
 *             - $ref: '#/components/schemas/ServerTextMessage'
 *             - $ref: '#/components/schemas/ServerFileMessage'
 *       required: [type, message]
 *     
 *     ServerTextMessage:
 *       type: object
 *       description: Text message sent from server to all connected clients
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [text]
 *         sender:
 *           type: string
 *         text:
 *           type: string
 *         timestamp:
 *           type: number
 *       required: [id, type, sender, text, timestamp]
 *     
 *     ServerFileMessage:
 *       type: object
 *       description: File message sent from server to all connected clients
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [file]
 *         sender:
 *           type: string
 *         fileData:
 *           type: string
 *         fileName:
 *           type: string
 *         mimeType:
 *           type: string
 *         fileSize:
 *           type: number
 *         timestamp:
 *           type: number
 *       required: [id, type, sender, fileData, fileName, mimeType, fileSize, timestamp]
 *     
 *     ErrorMessage:
 *       type: object
 *       description: Error notification sent from server to specific client
 *       properties:
 *         type:
 *           type: string
 *           enum: [error]
 *         message:
 *           type: string
 *       required: [type, message]
 *     
 *     UserDataMessage:
 *       type: object
 *       description: Complete list of all registered users with their online status
 *       properties:
 *         type:
 *           type: string
 *           enum: [userData]
 *         users:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               username:
 *                 type: string
 *               isOnline:
 *                 type: boolean
 *             required: [id, username, isOnline]
 *       required: [type, users]
 *     
 *     UserStatusChangedMessage:
 *       type: object
 *       description: Notification about user online/offline status change
 *       properties:
 *         type:
 *           type: string
 *           enum: [userStatusChanged]
 *         id:
 *           type: string
 *         isOnline:
 *           type: boolean
 *       required: [type, id, isOnline]
 *     
 *     HistoryMessage:
 *       type: object
 *       description: Recent message history sent to newly connected client
 *       properties:
 *         type:
 *           type: string
 *           enum: [history]
 *         messages:
 *           type: array
 *           items:
 *             oneOf:
 *               - $ref: '#/components/schemas/ServerTextMessage'
 *               - $ref: '#/components/schemas/ServerFileMessage'
 *       required: [type, messages]
 */