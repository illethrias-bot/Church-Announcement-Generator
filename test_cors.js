import http from 'http';

http.createServer(async (req, res) => {
  const url = `https://calendar.google.com/calendar/ical/rk.farnost.porici%40gmail.com/public/basic.ics`;
  const response = await fetch(url, { method: 'OPTIONS' });
  console.log(response.headers.get('access-control-allow-origin'));
  res.end('done');
}).listen(3001, () => {
  console.log('Listening on 3001');
});
