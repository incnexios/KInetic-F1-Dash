import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { AlignLeft, Clock } from 'lucide-react';

export function LapByLapWidget({ id }: { id: string }) {
    const [news, setNews] = useState<any[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchNews = async () => {
            try {
                const res = await fetch('https://cdn.monterosa.cloud/events/76/76927826-b61c-484d-8470-effc4f42260d/history.json');
                const data = await res.json();
                if (data && data.timeline && isMounted) {
                    setNews(data.timeline.reverse());
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchNews();
        const interval = setInterval(fetchNews, 30000); // Polling every 30s
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const renderBlock = (item: any) => {
        const type = item.content_type;
        const fields = item.custom_fields?.all || {};
        const time = item.published_at_iso ? new Date(item.published_at_iso).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' }) : '';

        if (type === 'audio-element') {
             const audioSrc = fields.src || '';
             return (
                 <div className="flex flex-col gap-2">
                     <span className="font-bold text-sm tracking-tight text-[#e10600]">{fields.title || 'TEAM RADIO'}</span>
                     <audio src={audioSrc} controls preload="metadata" className="w-full h-8 grayscale opacity-80" />
                 </div>
             )
        }

        return (
            <div className="flex flex-col gap-2 relative">
               {(fields.title || fields.subtitle) && (
                   <div className="flex items-center justify-between">
                       <span className="font-bold tracking-tight text-[#f7d627] whitespace-pre-wrap">{fields.title}</span>
                       <span className="text-xs text-white/50 font-mono tracking-tighter">{fields.subtitle || time}</span>
                   </div>
               )}
               {fields.imageUrl && (
                   <img src={`https://media.formula1.com/image/upload/f_auto,c_limit,w_800,q_auto/${fields.imageUrl}`} className="w-full rounded-sm object-cover my-1" alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
               )}
               {fields.text && (
                   <div className="text-sm text-white/80 font-normal leading-relaxed text-pretty" dangerouslySetInnerHTML={{ __html: fields.text }} />
               )}
            </div>
        )
    };

    return (
        <div className="flex flex-col h-full bg-[#15151e] border border-white/5 rounded-sm overflow-hidden">
             <div className="flex items-center px-4 py-3 border-b border-white/10 bg-black/40 shrink-0 gap-2">
                  <AlignLeft className="w-4 h-4 text-white/50" />
                  <span className="font-bold text-xs uppercase tracking-widest text-white/80">Lap By Lap</span>
             </div>
             <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {news.map((item, idx) => (
                      <div key={item.id || idx} className="flex flex-col bg-[#1f2025] p-4 rounded-sm border-l-[3px] border-[#383a42]">
                           {renderBlock(item)}
                      </div>
                  ))}
             </div>
        </div>
    );
}
