// import sslRedirect from "heroku-ssl-redirect";
// import path from "path";
// import express from "express";
// import rateLimit from "express-rate-limit";
// const path = require("path");
// const express = require("express");
//
// const app = express(); // create express app
//
// // add middlewares
// app.use(express.static(path.join(__dirname, "..", "build")));
// app.use(express.static("public"));
//
// app.use((req, res, next) => {
//     res.sendFile(path.join(__dirname, "..", "build", "index.html"));
// });
//
// // set port, listen for requests
// const PORT = process.env.PORT || 8082;
// app.listen(PORT, () => {
//     console.log(`Web app server is listening at http://localhost:${PORT}`);
// });

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const port = process.env.PORT || 8080;
// const CORS_ORIGIN = process.env.WEB_APP_ORIGIN || 'http://localhost:3000';

// console.log('cors origin', CORS_ORIGIN);

const app = express();
// add middlewares to serve react app
console.log("current directory: ", __dirname);
app.use(express.static(path.join(__dirname, "..", "build")));
// app.use(express.static(path.join(__dirname, "..", "public")));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origins: "*:*",
        methods: ["GET", "POST"],
        allowedHeaders: ["content-type"],
        pingTimeout: 7000,
        pingInterval: 3000
    }
});

// Middlewares
app.use(cors({
    origin: "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// example of a HTTP endpoint (useful if you do db stuff later like saving messages and custom auth):
// app.get('/join', (req, res) => {
//     res.send({ link: uuidV4() });
// });

io.on('connection', socket => {
    console.log('user connected');

    socket.on('join-room', (userData) => {
        const { socketId, roomId, name, status } = userData;

        console.log(`user joined ${roomId}`, userData);

        socket.join(roomId);
        io.in(roomId).emit('new-user-connect', userData);
        socket.on('peer-id-offer', (peerIdData) => {
            console.log('peer-id-offer');
            socket.to(roomId).emit('peer-id-received', peerIdData);
        });
        socket.on('chat-message', (chatData) => {
            console.log('chat message');
            io.to(roomId).emit('chat-message', chatData);
        });
        socket.on('update', () => {
            console.log('user update');
            io.to(roomId).emit('user-update', userData);
        });
        socket.on('disconnect', () => {
            console.log('user disconnected');
            io.in(roomId).emit('user-disconnected', userData);
        });
        socket.on('broadcast-message', (message) => {
            io.in(roomId).emit('new-broadcast-messsage', {...message, userData});
        });
        // socket.on('reconnect-user', () => {
        //     socket.to(roomID).broadcast.emit('new-user-connect', userData);
        // });
        socket.on('display-media', (value) => {
            io.in(roomId).emit('display-media', {socketId, value });
        });
        socket.on('user-video-off', (value) => {
            io.in(roomId).emit('user-video-off', value);
        });
    });
});

// Server listen initilized
server.listen(port, () => {
    console.log(`Listening on the port ${port}`);
}).on('error', e => {
    console.error(e);
});
