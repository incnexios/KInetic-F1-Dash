const WebSocket = require('ws');
const pako = require('pako');

const ws = new WebSocket('wss://proxy.cloudflare-eggshell171.workers.dev');

function decompress(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  try {
    return JSON.parse(new TextDecoder().decode(pako.inflateRaw(bytes)));
  } catch {
    return JSON.parse(new TextDecoder().decode(pako.inflate(bytes)));
  }
}

ws.on('open', () => {
    console.log('connected');
    ws.send(JSON.stringify({protocol:'json',version:1}) + '\x1e');
    setTimeout(() => {
    ws.send(JSON.stringify({
        type:1,
        target:'Subscribe',
        arguments:[['Position.z']],
        invocationId:'2'
    }) + '\x1e');
    }, 2000);
});

ws.on('message', (msg) => {
    for (const frame of msg.toString().split('\x1e').filter(Boolean)) {
        const data = JSON.parse(frame);
        if (data.type === 1 && data.target === 'feed') {
            let [topic, payload] = data.arguments;
            if (topic === 'Position.z') {
                payload = decompress(payload);
                console.log(JSON.stringify(payload, null, 2).slice(0, 500));
                process.exit();
            }
        }
    }
});
