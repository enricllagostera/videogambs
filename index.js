const fs = require('fs');
const datauri = require('datauri');

(async function ()
{
  const res = await datauri('./src/encoder/1.mp4');
  // const json = JSON.stringify({ video: res });
  fs.writeFileSync("./src/encoder/output.txt", '"' + res + '"');
})()