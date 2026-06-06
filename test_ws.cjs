const { WebSocket } = require('ws');

async function getHub() {
    const res = await fetch('https://livetiming.formula1.com/signalr/negotiate?connectionData=%5B%7B%22name%22%3A%22Streaming%22%7D%5D&clientProtocol=1.5', {
        headers: {
            'User-Agent': 'BestHTTP'
        }
    });
    const data = await res.json();
    return data.ConnectionToken;
}

async function run() {
    const token = await getHub();
    const ws = new WebSocket(`wss://livetiming.formula1.com/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionToken=${encodeURIComponent(token)}&connectionData=%5B%7B%22name%22%3A%22Streaming%22%7D%5D`);

    ws.on('open', () => {
        ws.send(JSON.stringify({
            "H": "Streaming",
            "M": "Subscribe",
            "A": [["TeamRadio", "SessionInfo"]],
            "I": 1
        }));
    });

    ws.on('message', (msg) => {
        const str = msg.toString();
        if (str.includes('TeamRadio')) {
            console.log("TeamRadio:", str);
        }
        if (str.includes('SessionInfo') && !str.includes('Subscribe')) {
            console.log("SessionInfo:", str.substring(0, 100));
        }
    });

    setTimeout(() => {
        ws.close();
        process.exit(0);
    }, 5000);
}

run();
