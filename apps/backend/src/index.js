
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { authenticateSocket } = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ msg: 'Chat app backend running' }));

// API routes
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const io = new Server(server, { cors: { origin: '*' } });
const socketIO = require('./socketIO');
socketIO.setIO(io);
io.use(authenticateSocket);
io.on('connection', (socket) => {
  require('./socket')(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('Server listening', PORT));
