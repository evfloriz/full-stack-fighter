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

io.on('connection', (socket) => {
    console.log('user connected');
})


/*app.get('/', (req, res) => {
    res.send('<h1>Hello world</h1>');
});*/

server.listen(3000, () => {
    console.log('server running at localhost:3000');
});
