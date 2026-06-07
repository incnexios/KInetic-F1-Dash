async function test() {
  const res = await fetch('https://cdn.monterosa.cloud/events/76/76927826-b61c-484d-8470-effc4f42260d/history.json');
  const data = await res.json();
  const social = data.timeline.filter((x: any) => x.content_type === 'social-element');
  const platforms = [...new Set(social.map((x: any) => x.custom_fields.all.socialPlatform))];
  console.log('Platforms:', platforms);
}
test();
