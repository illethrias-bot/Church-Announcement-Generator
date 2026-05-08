/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Calendar, 
  Info, 
  Copy, 
  Check,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  GripVertical,
  Bold,
  Italic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { startOfWeek, addDays, subDays, format, parseISO, isSameDay } from 'date-fns';
import { cs } from 'date-fns/locale';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// --- Types ---

export interface EventItem {
  id: string;
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
}

interface DaySchedule {
  id: string;
  dayName: string;
  date: string;
  events: EventItem[];
}

interface AnnouncementData {
  weekTitle: string;
  days: DaySchedule[];
  specialNotices: string[];
}

// --- Helper for fetching data ---
interface ApiEvent {
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
}

// --- Initial Data (from the example) ---

const INITIAL_DATA: AnnouncementData = {
  weekTitle: "4. neděle postní 30. 3. 2025",
  days: [
    {
      id: '1',
      dayName: "neděle",
      date: "30. 3. 2025",
      events: [
        { id: 'ev-1', text: "Mše 8:30 Kostel sv. Havla v Poříčí" },
        { id: 'ev-2', text: "Mše 10:00 Vranov" },
        { id: 'ev-3', text: "Mše 11:30 Teplýšovice" },
        { id: 'ev-4', text: "Mše 16:00 Hospic" }
      ]
    },
    {
      id: '2',
      dayName: "úterý",
      date: "1. 4. 2025",
      events: [{ id: 'ev-5', text: "Náboženství 14:30 ZŠ Čerčany" }]
    },
    {
      id: '3',
      dayName: "středa",
      date: "2. 4. 2025",
      events: [
        { id: 'ev-6', text: "Středa po 4. neděli postní" },
        { id: 'ev-7', text: "Mše 18:00 Kostel sv. Petra v Poříčí" }
      ]
    },
    {
      id: '4',
      dayName: "čtvrtek",
      date: "3. 4. 2025",
      events: [
        { id: 'ev-8', text: "Mše 16:00 Hospic" },
        { id: 'ev-9', text: "Náboženství 13:45 Poříčí Fara" },
        { id: 'ev-10', text: "Adorace 19:00-22:00 kostel sv. Havla v Poříčí" }
      ]
    },
    {
      id: '5',
      dayName: "pátek",
      date: "4. 4. 2025",
      events: [
        { id: 'ev-11', text: "Mše 10:00 Kostel sv. Petra v Poříčí" },
        { id: 'ev-12', text: "Mše 17:00 Vranov" },
        { id: 'ev-13', text: "Náboženství 12:30 ZŠ Teplýšovice" },
        { id: 'ev-14', text: "Adorace 19:00-20:00 Poříčí kostel sv. Petra" },
        { id: 'ev-15', text: "18:00 Pobožnost křížové cesty" }
      ]
    },
    {
      id: '6',
      dayName: "sobota",
      date: "5. 4. 2025",
      events: [
        { id: 'ev-16', text: "Mše 18:30 Soběhrdy" },
        { id: 'ev-17', text: "Fatimské večeřadlo (info u pana Hubičky 603 463 412)" },
        { id: 'ev-18', text: "moje pouť sv. rok – vlakem do kostela sv. Ludmily" }
      ]
    },
    {
      id: '7',
      dayName: "neděle",
      date: "6. 4. 2025",
      events: [
        { id: 'ev-19', text: "5. neděle postní" },
        { id: 'ev-20', text: "Mše 8:30 Kostel sv. Havla v Poříčí" },
        { id: 'ev-21', text: "Mše 10:00 Vranov" },
        { id: 'ev-22', text: "Mše 11:30 Teplýšovice" },
        { id: 'ev-23', text: "Mše 16:00 Hospic" },
        { id: 'ev-24', text: "Agapé po mši 8:30 Fara Poříčí" },
        { id: 'ev-25', text: "Biblická hodina 17:30 Fara Poříčí" }
      ]
    }
  ],
  specialNotices: [
    "Intence na duben – volné",
    "Hradiště další mše – 10. 5. 2025"
  ]
};

// --- Main Component ---

export default function App() {
  const [data, setData] = useState<AnnouncementData>(INITIAL_DATA);
  const [copied, setCopied] = useState(false);
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  
  // Week state: defaults to upcoming week's Sunday
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), 7)
  );

  // Set explicitly on mount to avoid hydration mismatch (optional but good)
  useEffect(() => {
    setCurrentWeekStart(addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), 7));
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);

  // Handle printing
  const handlePrint = () => {
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch (e) {
      inIframe = true;
    }

    if (inIframe) {
      setShowPrintWarning(true);
    } else {
      window.print();
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
    setShowPrintWarning(false);
  };

  const handlePrevWeek = () => setCurrentWeekStart(prev => subDays(prev, 7));
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));

  const syncCalendar = async () => {
    setIsSyncing(true);
    try {
      const startParam = currentWeekStart.toISOString();
      const endParam = addDays(currentWeekStart, 8).toISOString(); // 8 days to include the final Sunday entirely (up to Monday midnight)
      const response = await fetch(`/api/events?start=${startParam}&end=${endParam}`);
      const apiData = await response.json();
      
      const newDays: DaySchedule[] = [];
      const daysCount = 8; // Sunday to Sunday inclusive

      for (let i = 0; i < daysCount; i++) {
        const currentDate = addDays(currentWeekStart, i);
        const dayEvents = apiData.events.filter((e: ApiEvent) => isSameDay(parseISO(e.start), currentDate));
        
        // Filter out empty days unless it's the start or end Sunday, we might want to keep all days.
        // The example shows skipping some days if there are no events (e.g. no Monday).
        if (dayEvents.length > 0 || i === 0 || i === 7) {
          const eventsList = dayEvents.map((e: ApiEvent) => {
            const startDate = parseISO(e.start);
            // Check if it's an all-day event (hours = 0, mins = 0, or based on node-ical flags, but we'll guess by duration)
            const isAllDay = (parseISO(e.end).getTime() - startDate.getTime()) % (1000 * 60 * 60 * 24) === 0;
            
            let timeStr = "";
            if (!isAllDay && (startDate.getHours() > 0 || startDate.getMinutes() > 0)) {
              timeStr = format(startDate, 'H:mm', { locale: cs });
            }

            const parts = [timeStr, e.title].filter(Boolean);
            let evtText = parts.join(' ');
            
            return {
              id: `evt-${crypto.randomUUID()}`,
              text: evtText.trim()
            };
          });

          newDays.push({
            id: `sync-${i}`,
            dayName: format(currentDate, 'EEEE', { locale: cs }),
            date: format(currentDate, 'd. M. yyyy', { locale: cs }),
            events: eventsList.length ? eventsList : [{ id: `evt-${crypto.randomUUID()}`, text: '' }]
          });
        }
      }

      setData(prev => ({
        ...prev,
        weekTitle: `Týden od ${format(currentWeekStart, 'd. M.')} do ${format(addDays(currentWeekStart, 7), 'd. M. yyyy')}`,
        days: newDays
      }));
    } catch (err) {
      console.error('Failed to sync', err);
      alert('Failed to sync calendar. See console for details.');
    } finally {
      setIsSyncing(false);
    }
  };

  // State updates
  const updateWeekTitle = (title: string) => setData(prev => ({ ...prev, weekTitle: title }));
  
  const updateDay = (id: string, updates: Partial<DaySchedule>) => {
    setData(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };

  const addEvent = (dayId: string) => {
    setData(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, events: [...d.events, { id: `evt-${crypto.randomUUID()}`, text: '' }] } : d)
    }));
  };

  const updateEvent = (dayId: string, eventId: string, value: string) => {
    setData(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? {
        ...d,
        events: d.events.map(e => e.id === eventId ? { ...e, text: value } : e)
      } : d)
    }));
  };

  const toggleEventFormat = (dayId: string, eventId: string, formatId: 'isBold' | 'isItalic') => {
    setData(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? {
        ...d,
        events: d.events.map(e => e.id === eventId ? { ...e, [formatId]: !e[formatId] } : e)
      } : d)
    }));
  };

  const removeEvent = (dayId: string, eventId: string) => {
    setData(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? {
        ...d,
        events: d.events.filter(e => e.id !== eventId)
      } : d)
    }));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      const dayId = source.droppableId;
      const dayIndex = data.days.findIndex(d => d.id === dayId);
      if (dayIndex === -1) return;

      const newDays = [...data.days];
      const newEvents = Array.from(newDays[dayIndex].events);
      const [reorderedItem] = newEvents.splice(source.index, 1);
      newEvents.splice(destination.index, 0, reorderedItem);

      newDays[dayIndex] = { ...newDays[dayIndex], events: newEvents };
      setData(prev => ({ ...prev, days: newDays }));
    } else {
      const sourceDayIndex = data.days.findIndex(d => d.id === source.droppableId);
      const destDayIndex = data.days.findIndex(d => d.id === destination.droppableId);
      if (sourceDayIndex === -1 || destDayIndex === -1) return;

      const newDays = [...data.days];
      const sourceEvents = Array.from(newDays[sourceDayIndex].events);
      const destEvents = Array.from(newDays[destDayIndex].events);
      const [movedItem] = sourceEvents.splice(source.index, 1);
      
      destEvents.splice(destination.index, 0, movedItem);

      newDays[sourceDayIndex] = { ...newDays[sourceDayIndex], events: sourceEvents };
      newDays[destDayIndex] = { ...newDays[destDayIndex], events: destEvents };
      
      setData(prev => ({ ...prev, days: newDays }));
    }
  };

  const addNotice = () => setData(prev => ({ ...prev, specialNotices: [...prev.specialNotices, ''] }));
  
  const updateNotice = (index: number, value: string) => {
    setData(prev => ({
      ...prev,
      specialNotices: prev.specialNotices.map((n, i) => i === index ? value : n)
    }));
  };

  const removeNotice = (index: number) => {
    setData(prev => ({
      ...prev,
      specialNotices: prev.specialNotices.filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = () => {
    const text = `${data.weekTitle}\n\n` + 
      data.days.map(d => `${d.dayName} ${d.date}:\n${d.events.map(e => `- ${e.text}`).join('\n')}`).join('\n\n') +
      `\n\n${data.specialNotices.join('\n')}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentWeekLabel = `${format(currentWeekStart, 'd. M. yyyy', { locale: cs })} – ${format(addDays(currentWeekStart, 7), 'd. M. yyyy', { locale: cs })}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <AnimatePresence>
        {showPrintWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowPrintWarning(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6"
            >
              <button 
                onClick={() => setShowPrintWarning(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-full mb-2">
                <Printer size={24} />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Print from a new tab</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  You are currently viewing this app inside a safe preview environment. For security reasons, standard printing is blocked here.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed mt-2">
                  Please open the application in a new tab. Once opened, the print button will work perfectly.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowPrintWarning(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={openInNewTab}
                  className="flex items-center gap-2 px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                  <ExternalLink size={16} />
                  Open in New Tab
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global CSS for Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .page-break { page-break-before: always; }
          @page { margin: 1.5cm; }
        }
        .print-only { display: none; }
      `}} />

      {/* Header / Nav */}
      <header className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <FileText size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Church Announcement Generator</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Printer size={16} />
            Print Document
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Editor Section */}
        <section className="no-print space-y-8">
          
          {/* Data Source & Sync */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
            {isSyncing && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <RefreshCw className="animate-spin text-indigo-500" size={24} />
              </div>
            )}
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <RefreshCw size={14} /> Synchronize Data
            </h2>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrevWeek}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-sm font-medium w-48 text-center bg-slate-50 py-2 rounded-lg border border-slate-100">
                  {currentWeekLabel}
                </div>
                <button 
                  onClick={handleNextWeek}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              
              <button 
                onClick={syncCalendar}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                Fetch from Google Calendar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Info size={14} /> General Info
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Week Title (e.g. 4. neděle postní)</label>
                <input 
                  type="text"
                  value={data.weekTitle}
                  onChange={(e) => updateWeekTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-lg"
                  placeholder="Enter week title..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 ml-1">
              <Calendar size={14} /> Weekly Schedule
            </h2>
            
            <DragDropContext onDragEnd={onDragEnd}>
            {data.days.map((day) => (
              <div key={day.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input 
                      type="text"
                      value={day.dayName}
                      onChange={(e) => updateDay(day.id, { dayName: e.target.value })}
                      className="bg-transparent font-bold text-slate-700 outline-none focus:text-indigo-600"
                      placeholder="Day name"
                    />
                    <input 
                      type="text"
                      value={day.date}
                      onChange={(e) => updateDay(day.id, { date: e.target.value })}
                      className="bg-transparent text-slate-500 text-right outline-none focus:text-indigo-600"
                      placeholder="Date"
                    />
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <Droppable droppableId={day.id}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 min-h-[10px]">
                        {day.events.map((event, idx) => (
                          <Draggable key={event.id} draggableId={event.id} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-2 group p-1 -m-1 rounded-lg ${snapshot.isDragging ? 'bg-indigo-50 shadow p-2' : ''}`}
                              >
                                <div 
                                  {...provided.dragHandleProps}
                                  className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing px-1"
                                >
                                  <GripVertical size={16} />
                                </div>
                                <input 
                                  type="text"
                                  value={event.text}
                                  onChange={(e) => updateEvent(day.id, event.id, e.target.value)}
                                  className={`flex-1 py-1 text-sm outline-none bg-transparent border-b border-transparent focus:border-slate-200 transition-colors ${event.isBold ? 'font-bold' : ''} ${event.isItalic ? 'italic' : ''}`}
                                  placeholder="Event description..."
                                />
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => toggleEventFormat(day.id, event.id, 'isBold')}
                                    className={`p-1.5 rounded ${event.isBold ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                  >
                                    <Bold size={14} />
                                  </button>
                                  <button
                                    onClick={() => toggleEventFormat(day.id, event.id, 'isItalic')}
                                    className={`p-1.5 rounded ${event.isItalic ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                  >
                                    <Italic size={14} />
                                  </button>
                                  <button 
                                    onClick={() => removeEvent(day.id, event.id)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  
                  <button 
                    onClick={() => addEvent(day.id)}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors w-full justify-center border border-dashed border-indigo-200 mt-2"
                  >
                    <Plus size={14} /> Add Event
                  </button>
                </div>
              </div>
            ))}
            </DragDropContext>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Info size={14} /> Special Notices
            </h2>
            <div className="space-y-3">
              {data.specialNotices.map((notice, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <input 
                    type="text"
                    value={notice}
                    onChange={(e) => updateNotice(idx, e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-100 focus:border-indigo-300 outline-none transition-all text-sm"
                    placeholder="Notice text..."
                  />
                  <button 
                    onClick={() => removeNotice(idx)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={addNotice}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 py-2 px-3 rounded-lg hover:bg-indigo-50 transition-colors w-full justify-center border border-dashed border-indigo-200"
              >
                <Plus size={14} /> Add Notice
              </button>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="relative">
          <div className="no-print sticky top-28 mb-6 flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Live Preview</h2>
            <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono">A4 Portrait</span>
          </div>

          {/* The Actual Document */}
          <div className="no-print bg-white shadow-2xl rounded-sm mx-auto w-full max-w-[210mm] min-h-[297mm] p-[1.5cm] text-black font-serif leading-tight origin-top transition-transform">
            {/* Document Content */}
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b-2 border-black pb-2 mb-4">
                <h1 className="text-2xl font-bold">{data.weekTitle}</h1>
              </div>

              {/* Table */}
              <table className="w-full border-collapse border border-black">
                <tbody>
                  {data.days.map((day) => (
                    <tr key={day.id} className="border-b border-black last:border-b-0">
                      <td className="w-1/4 p-2 border-r border-black align-top">
                        <div className="font-bold">{day.dayName}</div>
                        <div className="text-sm">{day.date}</div>
                      </td>
                      <td className="p-2 align-top">
                        <ul className="list-none space-y-1">
                          {day.events.map((event) => (
                            <li key={event.id} className={`text-[15px] ${event.isBold ? 'font-bold' : ''} ${event.isItalic ? 'italic' : ''}`}>{event.text}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Special Notices */}
              <div className="pt-4 space-y-2">
                {data.specialNotices.map((notice, idx) => (
                  <p key={idx} className="text-[15px]">{notice}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Print-only version (simplified for actual printing) */}
          <div className="print-only bg-white text-black font-serif leading-tight">
             <div className="border-b-2 border-black pb-2 mb-4">
                <h1 className="text-2xl font-bold">{data.weekTitle}</h1>
              </div>
              <table className="w-full border-collapse border border-black">
                <tbody>
                  {data.days.map((day) => (
                    <tr key={day.id} className="border-b border-black last:border-b-0">
                      <td className="w-1/4 p-2 border-r border-black align-top">
                        <div className="font-bold">{day.dayName}</div>
                        <div className="text-sm">{day.date}</div>
                      </td>
                      <td className="p-2 align-top">
                        <ul className="list-none space-y-1">
                          {day.events.map((event) => (
                            <li key={event.id} className={`text-[15px] ${event.isBold ? 'font-bold' : ''} ${event.isItalic ? 'italic' : ''}`}>{event.text}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pt-4 space-y-2">
                {data.specialNotices.map((notice, idx) => (
                  <p key={idx} className="text-[15px]">{notice}</p>
                ))}
              </div>
          </div>
        </section>
      </main>

      <footer className="no-print mt-20 border-t border-slate-200 py-10 px-6 text-center text-slate-400 text-sm">
        <p>&copy; 2025 Church Announcement Generator. Designed for clarity and community.</p>
      </footer>
    </div>
  );
}
