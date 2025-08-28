import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
/*const io = new Server(server, {
    cors: {
        origin: 'http://localhost:8080',
        methods:['GET', 'POST']
    }
});*/

const io = new Server(server);

const pairs = [];
let index = 0;

io.on('connection', (socket) => {
    // set connection index to whatever index is
    let clientIndex = index;
    index++;

    // add it to the list of pairs
    pairs.push(socket);

    let roomIndex = Math.floor(clientIndex / 2);
    let room = 'room' + roomIndex;

    socket.join(room);
    io.to(room).emit('check', 'in ' + room);

    //let p1_pos = {x: 0, y: 0};
    
    // determine p1 and p2
    let isPlayer1 = (clientIndex % 2 == 0);
    console.log(isPlayer1);

    console.log('user connected, client index ' + clientIndex);
    socket.emit('isPlayer1', isPlayer1);


    socket.on('player1_inputs', (data) => {
        //console.log('x: ' + data.x + ' y: ' + data.y);
        io.to(room).emit('player1_inputs', data);
    })

    socket.on('player2_inputs', (data) => {
        io.to(room).emit('player2_inputs', data);
    })

    
})

/*

Strategy (for now):
One user connects -> p1
Another user connects -> p2

p1 sends xy data for itself, received by p2
p2 sends xy data for itself, received by p1



*/


/*app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});*/

server.listen(3000, () => {
    console.log('server running at localhost:3000');
});
