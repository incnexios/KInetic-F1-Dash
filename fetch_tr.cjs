async function run() {
    const res = await fetch('https://livetiming.formula1.com/static/2026/2026-06-07_Monaco_Grand_Prix/2026-06-06_Practice_3/TeamRadio.json');
    const data = await res.json();
    console.log(JSON.stringify(data.Captures.slice(0, 3), null, 2));
}
run();
