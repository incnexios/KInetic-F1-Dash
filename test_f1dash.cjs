const WebSocket = require('ws');
const ws = new WebSocket('wss://f1dash.net/ws', {
    headers: {
        // 'Origin': 'https://v2.f1dash.net' 
    }
});
ws.on('open', () => {
    console.log('Opened');
    ws.close();
});
ws.on('error', (err) => {
    console.error('Error:', err.message);
});
ws.on('unexpected-response', (req, res) => {
    console.log('Unexpected response:', res.statusCode);
});
