async function test() {
  const res = await fetch('https://cdn.monterosa.cloud/events/76/76927826-b61c-484d-8470-effc4f42260d/history.json');
  const data = await res.json();
  const types = [...new Set(data.timeline.map((x: any) => x.content_type))];
  console.log('Types:', types);
  const social = data.timeline.filter((x: any) => x.content_type === 'social-element' || x.content_type === 'social-media' || x.content_type === 'tweet' || x.content_type === 'social');
  console.log('Social:', JSON.stringify(social.slice(0, 2), null, 2));

  // what about block type?
  const blocksWithSocial = data.timeline.filter((x: any) => JSON.stringify(x).includes('twitter') || JSON.stringify(x).includes('social'));
  console.log('Social Blocks:', JSON.stringify(blocksWithSocial.slice(0, 1), null, 2));
}
test();
