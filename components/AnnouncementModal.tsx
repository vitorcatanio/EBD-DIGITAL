
import React from 'react';
import { Announcement } from '../types';

interface AnnouncementModalProps {
  announcement: Announcement;
  onRead: (id: string) => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ announcement, onRead }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 animate-in zoom-in duration-300 shadow-2xl border-4 border-indigo-100">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl mx-auto flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Aviso Importante</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Postado por {announcement.authorName} • {announcement.date}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
          <h4 className="font-black text-indigo-600 mb-2 uppercase text-xs tracking-wider">{announcement.title}</h4>
          <p className="text-slate-600 leading-relaxed font-medium">{announcement.message}</p>
        </div>

        <button 
          onClick={() => onRead(announcement.id)}
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          Marcar como Lido
        </button>
      </div>
    </div>
  );
};

export default AnnouncementModal;
