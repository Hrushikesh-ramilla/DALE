async function check() {
  const res = await fetch('http://127.0.0.1:3000/category/watches');
  const html = await res.text();
  console.log("HTML length:", html.length);
  const re = /<img[^>]+>/g;
  let match;
  let count = 0;
  console.log("=== WATCHES IMGS ===");
  while ((match = re.exec(html)) !== null && count < 10) {
    console.log(count, match[0]);
    count++;
  }
}

check().catch(console.error);
