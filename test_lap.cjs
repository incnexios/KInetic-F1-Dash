async function run() {
    const res = await fetch('https://cdn.monterosa.cloud/events/76/76927826-b61c-484d-8470-effc4f42260d/history.json');
    const data = await res.json();
    const audios = data.timeline.filter(t => t.content_type === 'audio-element');
    console.log(audios.map(a => a.custom_fields.all.src));
}
run();
