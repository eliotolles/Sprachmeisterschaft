const fs = require('fs');
const path = require('path');

const dataDir = path.resolve(__dirname, '../src/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 20 Topics:
// alltag, familie, arbeit, wohnen, essen, einkaufen, gesundheit, reisen, verkehr, bildung,
// behoerden, geld, umwelt, freizeit, medien, meinung, gefuehle, technik, arbeitssuche, interkulturell

console.log("Generating Sprachmeisterschaft static datasets...");
