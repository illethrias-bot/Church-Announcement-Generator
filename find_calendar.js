import https from 'https';

https.get('https://www.farnostporici.cz/kalendar/', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const match = data.match(/src="https:\/\/calendar\.google\.com\/calendar\/[^"]+"/);
    if (match) {
      console.log(match[0]);
    } else {
      console.log('No calendar iframe found');
    }
  });
}).on('error', (err) => console.error(err));
