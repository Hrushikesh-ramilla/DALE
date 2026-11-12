const fs = require('fs');
const html = fs.readFileSync('scripts/phones-hub.html', 'utf8');
const cards = html.split('class="category-brand-card"');
for (let i = 1; i < cards.length; i++) {
  const card = cards[i];
  const nameMatch = card.match(/class="brand-name">([^<]+)<\/h2>/);
  const imgMatch = card.match(/src="([^"]+)"/);
  console.log(nameMatch ? nameMatch[1] : '?', '-->', imgMatch ? imgMatch[1] : 'none');
}
