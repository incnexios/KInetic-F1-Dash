const WebSocket = require('ws');
const ws = new WebSocket('wss://f1dash.net/ws', {
    headers: {
        'Origin': 'https://example.com' 
    }
});
ws.on('open', () => {
    console.log('Opened with dummy origin');
    ws.close();
});
ws.on('error', (err) => {
    console.error('Error:', err.message);
});
ws.on('unexpected-response', (req, res) => {
    console.log('Unexpected response:', res.statusCode);
});
