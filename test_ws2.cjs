const { WebSocket } = require('ws');

async function getHub() {
    const res = await fetch('http://127.0.0.1:3000/f1dash-ws/negotiate?connectionData=%5B%7B%22name%22%3A%22Streaming%22%7D%5D&clientProtocol=1.5', {
        headers: {
            'User-Agent': 'BestHTTP'
        }
    });
    console.log(res.status);
    const data = await res.json();
    return data.ConnectionToken;
}

async function run() {
    try {
        const token = await getHub();
        console.log("Token:", token);
        const ws = new WebSocket(`ws://127.0.0.1:3000/f1dash-ws/connect?clientProtocol=1.5&transport=webSockets&connectionToken=${encodeURIComponent(token)}&connectionData=%5B%7B%22name%22%3A%22Streaming%22%7D%5D`);

        ws.on('open', () => {
            ws.send(JSON.stringify({
                "H": "Streaming",
                "M": "Subscribe",
                "A": [["TeamRadio"]],
                "I": 1
            }));
        });

        ws.on('message', (msg) => {
            const str = msg.toString();
            if (str.includes('TeamRadio')) {
                console.log("TeamRadio:", str);
            }
        });

        setTimeout(() => {
            ws.close();
            process.exit(0);
        }, 5000);
    } catch(e) { console.error(e); }
}

run();
