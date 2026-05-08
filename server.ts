import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
// @ts-ignore
import ical from "node-ical";
import { startOfWeek, endOfWeek, isWithinInterval, addDays, getDay, parseISO, endOfDay } from "date-fns";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // The calendar IDs from the farnostporici embeds
  const CIDS = [
    'rk.farnost.porici@gmail.com',
    '708a4ffadf09eddd12b947829695536192054c353c0fed228ccf5c11c4ebab55@group.calendar.google.com',
    'abu9ioch08uhs3hfbpmq7tedak@group.calendar.google.com',
    'od3sbdroksev37opdlg1f7qel4@group.calendar.google.com',
    'c5e142a9ee98706665983d31da55b06902b745742f44ca75b275b4b5f837cf74@group.calendar.google.com',
    'a8ba922859e1a366013c81649fe45850b25ae93f97a77aa69bd086452748fbe4@group.calendar.google.com',
    '5a80efeae8c1624e35d9aa4a9d55a719088929d8fa9c023cc4fe983d343bd8a5@group.calendar.google.com',
    'c0a08075cc7511224ccfb45c7e5ad4c45a6edfeea85db03180e033045c9f75fc@group.calendar.google.com'
  ];

  app.use(express.json());

  // API Route to fetch events for a given time range
  app.get("/api/events", async (req, res) => {
    try {
      const { start, end } = req.query; 
      
      const startDate = start ? new Date(start as string) : startOfWeek(new Date(), { weekStartsOn: 0 });
      const endDate = end ? new Date(end as string) : addDays(startDate, 8);
      
      const eventsObj: any[] = [];

      const fetchPromises = CIDS.map(async (cid) => {
        const iCalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(cid)}/public/basic.ics`;
        try {
          const calendarData = await ical.async.fromURL(iCalUrl);
          const currentEvents: any[] = [];
          
          for (const k in calendarData) {
            if (calendarData.hasOwnProperty(k)) {
              const ev = calendarData[k];
              if (ev.type === 'VEVENT') {
                const evStart = ev.start;
                const evEnd = ev.end;
                
                if (ev.rrule) {
                  // Use endOfDay is not needed if the client passed an exact end boundary covering the whole day
                  const dates = ev.rrule.between(startDate, endDate);
                  if (dates.length > 0) {
                    for (const ds of dates) {
                      // Adjust duration for recurring events
                      const duration = evEnd.getTime() - evStart.getTime();
                      // @ts-ignore
                      const startInstance = new Date(ds);
                      
                      // Check for timezone offset shift due to daylight saving variations between the start date 
                      // of the rrule and the instance date. node-ical returns instances that might need a tweak, 
                      // but typically they are correct.
                      const endInstance = new Date(startInstance.getTime() + duration);
                      
                      currentEvents.push({
                        title: ev.summary,
                        start: startInstance,
                        end: endInstance,
                        location: ev.location || '',
                        description: ev.description || '',
                      });
                    }
                  }
                } else {
                  // Direct event
                  if (isWithinInterval(evStart, { start: startDate, end: endDate })) {
                    currentEvents.push({
                      title: ev.summary,
                      start: evStart,
                      end: evEnd,
                      location: ev.location || '',
                      description: ev.description || '',
                    });
                  }
                }
              }
            }
          }
          return currentEvents;
        } catch (e) {
          console.error(`Failed reading calendar ${cid}:`, e);
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      for (const res of results) {
        eventsObj.push(...res);
      }

      // Sort chronological
      eventsObj.sort((a, b) => a.start.getTime() - b.start.getTime());

      res.json({
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        events: eventsObj,
      });

    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
