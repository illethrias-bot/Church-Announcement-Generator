import https from 'https';

const cids = [
  'rk.farnost.porici@gmail.com',
  '708a4ffadf09eddd12b947829695536192054c353c0fed228ccf5c11c4ebab55@group.calendar.google.com',
  'abu9ioch08uhs3hfbpmq7tedak@group.calendar.google.com',
  'od3sbdroksev37opdlg1f7qel4@group.calendar.google.com',
  'c5e142a9ee98706665983d31da55b06902b745742f44ca75b275b4b5f837cf74@group.calendar.google.com',
  'a8ba922859e1a366013c81649fe45850b25ae93f97a77aa69bd086452748fbe4@group.calendar.google.com',
  '5a80efeae8c1624e35d9aa4a9d55a719088929d8fa9c023cc4fe983d343bd8a5@group.calendar.google.com',
  'c0a08075cc7511224ccfb45c7e5ad4c45a6edfeea85db03180e033045c9f75fc@group.calendar.google.com'
];

async function check() {
  for (const cid of cids) {
    const url = `https://calendar.google.com/calendar/ical/${encodeURIComponent(cid)}/public/basic.ics`;
    console.log(`Fetching ${url}...`);
    try {
      const resp = await fetch(url);
      console.log(`Status: ${resp.status}`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

check();
