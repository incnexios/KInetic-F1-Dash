async function run() {
    const res = await fetch('https://media.formula1.com/image/upload/f_auto,c_limit,w_800,q_auto/fom-website/Monterosa/2026/16x9-Monaco');
    console.log('fom-website no ext:', res.status);
}
run();
