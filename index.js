const express = require('express');
const winston = require('winston');
const { PassThrough } = require('stream');
const path = require('path');

const app = express();

// Create a Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(), // Log to console
    ],
});

// Create a stream to capture logs
const logStream = new PassThrough();
logStream.on('data', (chunk) => {
    // Emit logs to all connected clients
    sseStream.write(`data: ${chunk.toString()}\n\n`);
});

// Add a custom transport to stream logs
logger.add(new winston.transports.Stream({ stream: logStream }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));


app.use(express.json()); // Parse JSON request bodies

app.use((req, res, next) => {
    const { method, originalUrl, ip, body } = req;
    const timestamp = new Date().toISOString();

    // Log the request details
    logger.info({
        message: 'Request received',
        method,
        url: originalUrl,
        ip,
        body: method === 'POST' ? body : undefined, // Log body for POST requests
        timestamp,
    });

    next();
});


// SSE endpoint for real-time logs
let sseStream = new PassThrough();
app.get('/logs', (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial message
    res.write('data: Connected to log stream\n\n');

    // Pipe the SSE stream to the response
    sseStream.pipe(res);

    // Handle client disconnect
    req.on('close', () => {
        sseStream.unpipe(res);
    });
});



// Example route to generate logs
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve the HTML file
});

// Start the server
app.listen(3000, () => {
    logger.info('Server is running on http://localhost:3000');
});