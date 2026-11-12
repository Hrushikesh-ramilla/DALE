const https = require('https');
const fs = require('fs');

function get(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function main() {
  const icons = ['dell', 'razer', 'lenovo', 'hp', 'msi', 'acer'];
  const results = {};
  for (const name of icons) {
    const svg = await get('https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/' + name + '.svg');
    const match = svg.match(/<path d="([^"]+)"/);
    if (match) {
      results[name] = match[1];
    }
  }
  fs.writeFileSync('scripts/official-paths.json', JSON.stringify(results, null, 2));
  console.log('Saved official paths successfully!');
}

main().catch(console.error);
