async function run() {
    const res = await fetch('wss://f1dash.net/ws', { headers: { Origin: 'https://ais-test.vercel.app', 'User-Agent': 'Mozilla/5.0' } }).catch(()=>null);
    // actually, let's just fetch history json again
    const res2 = await fetch('https://cdn.monterosa.cloud/events/76/76927826-b61c-484d-8470-effc4f42260d/history.json');
    const data = await res2.json();
    console.log(Object.keys(data.driverList));
}
run();
