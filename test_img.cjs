async function run() {
    const res1 = await fetch('https://media.formula1.com/image/upload/f_auto,c_limit,w_800,q_auto/content/dam/fom-website/Monterosa/2026/16x9-Monaco.jpg');
    console.log('.jpg:', res1.status);
    
    const res2 = await fetch('https://media.formula1.com/image/upload/f_auto,c_limit,w_800,q_auto/content/dam/fom-website/Monterosa/2026/16x9-Monaco.png');
    console.log('.png:', res2.status);
    
    const res3 = await fetch('https://media.formula1.com/image/upload/f_auto,c_limit,w_800,q_auto/fom-website/Monterosa/2026/16x9-Monaco.jpg');
    console.log('no-dam .jpg:', res3.status);
}
run();
