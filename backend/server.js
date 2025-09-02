import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        //origin: 'http://localhost:8080',
        origin: 'https://full-stack-fighter.onrender.com/',
        methods:['GET', 'POST']
    }
});

// Serve static content
//const __dirname = dirname(fileURLToPath(import.meta.url));
//app.use(express.static(join(__dirname, 'dist')));

//const io = new Server(server);

let roomIndex = 0;

io.on('connection', (socket) => {
    let room = 'room' + roomIndex;

    socket.join(room);

    let users = io.sockets.adapter.rooms.get(room);
    
    // Determine p1 and p2 based on size of room after joining
    let isPlayer1 = (users.size % 2 == 1);
    socket.emit('isPlayer1', isPlayer1);
    
    if (users.size == 2) {
        // Increment the room index, looping at 1000
        roomIndex++;
        if (roomIndex > 1000) {
            roomIndex = 0;
        }

        io.to(room).emit('isRoomReady', true);
    }

    socket.on('confirm', () => {
        socket.on('player1_inputs', (data) => {
            io.to(room).emit('player1_inputs', data);
        });

        socket.on('player2_inputs', (data) => {
            io.to(room).emit('player2_inputs', data);
        });
    });

    socket.on('disconnect', () => {
        // Do nothing for now
    });
})

server.listen(3000, () => {
    console.log('Server running at https://full-stack-fighter-server.onrender.com:3000');
});
