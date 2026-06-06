async function run() {
    const res1 = await fetch('https://media.formula1.com/image/upload/f_auto,c_limit,w_800,q_auto/trackside-images/2026/F1_Grand_Prix_of_Monaco___Practice/2279967932.jpg');
    console.log('trackside .jpg:', res1.status);
    
    // Also test without extension
    const res2 = await fetch('https://media.formula1.com/image/upload/f_auto,c_limit,w_800,q_auto/trackside-images/2026/F1_Grand_Prix_of_Monaco___Practice/2279967932');
    console.log('trackside no-ext:', res2.status);
}
run();
