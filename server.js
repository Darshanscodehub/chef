require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// 1. Initialize App & DB
const app = express();
const server = http.createServer(app);
const io = new Server(server);

connectDB(); // Connect to MongoDB

// 2. Middleware (The Gatekeepers)
app.use(express.json()); // Allows server to read JSON data
app.use(express.urlencoded({ extended: false }));

// 3. Serve Static Frontend Files
// This makes your 'public' folder accessible on the web
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. API Routes (Placeholders for now)
app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/chefs', require('./routes/chefRoutes')); 
app.use('/api/bookings', require('./routes/bookingRoutes'));


// 5. Socket.io (Real-time Chat)
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Listen for chat messages
    socket.on('chatMessage', (msg) => {
        io.emit('message', msg); // Broadcast to everyone (Basic)
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

app.use('/api/chefs', require('./routes/chefRoutes'));

app.use('/api/admin', require('./routes/adminRoutes'));

// 6. Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});