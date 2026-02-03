import { createAdapter } from '@socket.io/redis-adapter';
import http from 'http';
import jwt from 'jsonwebtoken';
import { Server as IOServer, Socket } from 'socket.io';
import config from '../config';
import { pubClient, subClient } from '../redis';
import { TJwtPayload } from '../types/jsonwebtoken.type';

export let io: IOServer;

// Initialize Socket.io server
export const initializeSocket = async (
  server: http.Server,
): Promise<IOServer> => {
  try {
    // Create Socket.io server
    io = new IOServer(server, {
      cors: {
        origin: [
          'https://zaaz.vercel.app',
          'https://www.zaaz.vercel.app',
          'https://zaaz-website.vercel.app',
          'https://www.zaaz-website.vercel.app',
          'https://zaaz-server.vercel.app',
          'https://www.zaaz-server.vercel.app',
          'http://localhost:3000',
          'http://localhost:3008',
          'http://localhost:8080',
          'http://localhost:8081',
          'http://localhost:5000',
          'http://localhost:5005',
          process.env.URL as string,
          process.env.ADMINPANEL_URL as string,
          process.env.WEBSITE_URL as string,
        ]?.filter(Boolean),
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Setup Redis adapter if available
    await setupRedisAdapter();

    // Setup authentication middleware
    setupAuthMiddleware();

    // Setup connection handlers
    setupConnectionHandlers();

    console.log(`🔌 Socket.io initialized - PID: ${process.pid}`);
    return io;
  } catch (error) {
    console.error('❌ Socket.io initialization failed:', error);
    throw error;
  }
};

// Setup Redis adapter for clustering
const setupRedisAdapter = async (): Promise<void> => {
  try {
    if (!config.redis_enabled) {
      console.log('🔕 Redis disabled by configuration');
      return;
    }

    if (pubClient && subClient && pubClient.isOpen && subClient.isOpen) {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.io Redis adapter enabled (clustering support)');
    } else {
      console.log(
        'ℹ️ Socket.io running in single-instance mode (Redis unavailable)',
      );
    }
  } catch (error) {
    console.warn(
      '⚠️ Redis adapter setup failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    console.log('ℹ️ Socket.io running in single-instance mode');
  }
};

// Setup authentication middleware
const setupAuthMiddleware = (): void => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          socket.data.user = decoded;
          console.log(
            `🔐 Authenticated socket connection: ${socket.id} (User: ${decoded._id})`,
          );
        } else {
          console.log(`🔒 Invalid token for socket: ${socket.id}`);
        }
      } else {
        console.log(`🟡 Guest connection: ${socket.id}`);
      }

      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });
};

// Setup connection event handlers
const setupConnectionHandlers = (): void => {
  io.on('connection', (socket: Socket) => {
    handleConnection(socket);
  });
};

// Handle individual socket connections
const handleConnection = (socket: Socket): void => {
  const user = socket.data.user as TJwtPayload | undefined;

  // Join user-specific rooms if authenticated
  if (user?._id) {
    const userRoom = `user:${user._id}`;
    socket.join(userRoom);

    if (user.role) {
      socket.join(`role:${user.role}`);
    }

    console.log(
      `✅ User joined rooms - Socket: ${socket.id}, User: ${user._id}, Role: ${user.role || 'none'}`,
    );
  }

  // Handle custom events
  setupSocketEvents(socket);

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error: ${socket.id}`, error);
  });
};

// Setup custom socket event handlers
const setupSocketEvents = (socket: Socket): void => {
  // Example: Join custom room
  socket.on('join-room', (roomId: string) => {
    if (typeof roomId === 'string' && roomId.length > 0) {
      socket.join(roomId);
      socket.emit('room-joined', roomId);
      console.log(`📡 Socket ${socket.id} joined room: ${roomId}`);
    }
  });

  // Example: Leave custom room
  socket.on('leave-room', (roomId: string) => {
    if (typeof roomId === 'string') {
      socket.leave(roomId);
      socket.emit('room-left', roomId);
      console.log(`📡 Socket ${socket.id} left room: ${roomId}`);
    }
  });

  // Example: Send message to room
  socket.on('room-message', (data: { roomId: string; message: string }) => {
    if (data.roomId && data.message) {
      socket.to(data.roomId).emit('room-message', {
        from: socket.id,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    }
  });
};

// JWT token verification
const verifyToken = (token: string): TJwtPayload | null => {
  try {
    if (!token || !config.jwt_access_secret) {
      return null;
    }

    return jwt.verify(token, config.jwt_access_secret) as TJwtPayload;
  } catch (error) {
    console.warn(
      '⚠️ JWT verification failed:',
      error instanceof Error ? error.message : 'Invalid token',
    );
    return null;
  }
};

// Utility functions for emitting events

// Emit to specific user
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Emit to users with specific role
export const emitToRole = (role: string, event: string, data: any): void => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

// Emit to custom room
export const emitToRoom = (roomId: string, event: string, data: any): void => {
  if (io) {
    io.to(roomId).emit(event, data);
  }
};

// Broadcast to all connected clients
export const broadcast = (event: string, data: any): void => {
  if (io) {
    io.emit(event, data);
  }
};

// Get Socket.io instance (throws if not initialized)
export const getIO = (): IOServer => {
  if (!io) {
    throw new Error(
      'Socket.io not initialized. Call initializeSocket() first.',
    );
  }
  return io;
};

// Get connection count
export const getConnectionCount = async (): Promise<number> => {
  if (!io) return 0;

  try {
    const sockets = await io.fetchSockets();
    return sockets.length;
  } catch (error) {
    console.warn('⚠️ Failed to get connection count:', error);
    return 0;
  }
};

// Close all connections gracefully
export const closeConnections = async (): Promise<void> => {
  if (io) {
    console.log('🔌 Closing all socket connections...');

    try {
      const sockets = await io.fetchSockets();
      console.log(`📊 Closing ${sockets.length} active connections`);

      // Emit shutdown notice to all clients
      io.emit('server-shutdown', { message: 'Server is shutting down' });

      // Close server
      io.close();
      console.log('✅ Socket.io server closed');
    } catch (error) {
      console.warn('⚠️ Error closing socket connections:', error);
    }
  }
};
