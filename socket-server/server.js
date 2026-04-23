require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS mapped globally for standard payloads handling JSON.
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*', // Set to specific React frontend origin in production
    methods: ['GET', 'POST']
  }
});

// Map of userId -> socketId to keep track of connected users globally
const onlineUsers = new Map();

// JWT Middleware for authenticating connections leveraging standard JSONWebToken parsing
io.use((socket, next) => {
  try {
    let token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Unauthorized'));
    }

    token = token.replace('Bearer ', '');

    // Decoding token. JWT uses the same secret securely mapped synchronously with Laravel Auth token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attaching user blob to the socket session
    socket.user = {
      id: decoded.id || decoded.sub, 
      name: decoded.name || 'User', // May need to exist in Laravel claims
      email: decoded.email
    };

    next();
  } catch (err) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;
  onlineUsers.set(userId, socket.id);
  console.log(`[+] User Connected: ${userId} (${socket.id})`);

  // Event: join_conversation
  socket.on('join_conversation', async (data) => {
    try {
      const { conversation_id } = data;
      if (!conversation_id) return;
      
      const room = `conversation_${conversation_id}`;
      socket.join(room);
      socket.emit('joined_conversation', { conversation_id });
    } catch (error) {
        console.error(`[!] Error in join_conversation: `, error.message);
    }
  });

  // Event: send_message
  socket.on('send_message', async (data) => {
    try {
      const { conversation_id, message } = data;

      if (!message || message.trim().length === 0 || message.length > 1000) {
        return socket.emit('message_error', { message: 'Invalid message length' });
      }

      // Propagate payload securely via axios bypassing Standard user guard inside backend due to Socket header checks
      const response = await axios.post(
        `${process.env.LARAVEL_API_URL}/conversations/${conversation_id}/messages`,
        { sender_id: socket.user.id, message: message },
        { 
            headers: { 
                'X-Socket-Secret': process.env.SOCKET_SECRET,
                'Content-Type': 'application/json'
            }
        }
      );

      const savedMessage = response.data.message;

      // Ensure room broadcasts the message globally alongside sender detail parsing accurately
      io.to(`conversation_${conversation_id}`).emit('new_message', {
        id: savedMessage.id,
        conversation_id: savedMessage.conversation_id,
        sender_id: socket.user.id,
        sender_name: socket.user.name,
        // Since sender_avatar isn't purely in JWT, we rely on the client or fetch, here returning defaults if null
        sender_avatar: null, 
        message: savedMessage.message,
        created_at: savedMessage.created_at,
        is_read: false
      });

    } catch (error) {
      console.error(`[!] Error in send_message: `, error.response?.data || error.message);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Event: typing_start
  socket.on('typing_start', (data) => {
    try {
      const { conversation_id } = data;
      socket.to(`conversation_${conversation_id}`).emit('user_typing', {
        user_id: socket.user.id,
        user_name: socket.user.name
      });
    } catch (error) {
        console.error(`[!] Error in typing_start: `, error.message);
    }
  });

  // Event: typing_stop
  socket.on('typing_stop', (data) => {
    try {
      const { conversation_id } = data;
      socket.to(`conversation_${conversation_id}`).emit('user_stopped_typing', {
        user_id: socket.user.id
      });
    } catch (error) {
         console.error(`[!] Error in typing_stop: `, error.message);
    }
  });

  // Event: mark_read 
  socket.on('mark_read', async (data) => {
    try {
      const { conversation_id } = data;
      // Ideally here we can hit the Laravel backend to mark as read directly or it happens organically on /messages GET fetching.
      // E.g API: POST /api/conversations/{id}/read. Wait, the API specifies "/messages" GET marks them read. But let's trigger it.
      
      try {
           await axios.get(`${process.env.LARAVEL_API_URL}/conversations/${conversation_id}/messages`, {
               headers: {
                   'Authorization': `Bearer ${socket.handshake.auth.token}` // Impersonate safely by passing client token
               }
           });
      } catch (e) {
          console.error("Failed executing mark read in backend", e.message);
      }

      io.to(`conversation_${conversation_id}`).emit('messages_read', {
        conversation_id,
        read_by: socket.user.id
      });
    } catch (error) {
         console.error(`[!] Error in mark_read: `, error.message);
    }
  });

  // Event: disconnect
  socket.on('disconnect', () => {
    try {
        onlineUsers.delete(socket.user.id);
        console.log(`[-] User Disconnected: ${socket.user.id} (${socket.id})`);
        
        // Emitting globally over every room they historically joined
        socket.rooms.forEach(room => {
            if(room !== socket.id) {
                socket.to(room).emit('user_offline', { user_id: socket.user.id });
            }
        });
    } catch(error) {
        console.error(`[!] Error in disconnect handle: `, error.message);
    }
  });
});

// REST Endpoint: Get Online Users Array natively locked behind secret headers
app.get('/online-users', (req, res) => {
  if (req.headers['x-socket-secret'] !== process.env.SOCKET_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({
    success: true,
    online_users: Array.from(onlineUsers.keys())
  });
});

// REST Standard Health Check Ping
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'OCAS Socket Server',
    connections: io.engine.clientsCount
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[*] Node+Socket.io server running on http://localhost:${PORT}`);
});
