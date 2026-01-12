
import React from 'react';
import { Magazine, User } from '../types';

interface LibraryProps {
  magazines: Magazine[];
  onSelect: (id: string) => void;
  user: User;
}

const Library: React.FC<LibraryProps> = ({ magazines, onSelect, user }) => {
  return (
    <div className="px-4 py-6 md:px-10 md:py-12 max-w-7xl mx-auto space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-1">
        <div className="space-y-0">
          <h1 className="text-2xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">Minhas Lições</h1>
          <p className="text-slate-500 font-medium text-xs md:text-lg">
            Paz do Senhor, <span className="text-indigo-600 font-bold">{user.name}</span>.
          </p>
        </div>
        <div className="hidden lg:block">
           <span className="bg-slate-200/50 text-slate-500 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">Plataforma Digital</span>
        </div>
      </header>

      {magazines.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
          <div className="text-4xl mb-4 opacity-20">📖</div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Nenhum conteúdo disponível.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-8">
          {magazines.map((mag) => (
            <div 
              key={mag.id}
              onClick={() => onSelect(mag.id)}
              className="group cursor-pointer bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 flex flex-col h-full transform hover:-translate-y-1"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-50">
                <img src={mag.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-50"></div>
                <div className="absolute bottom-4 left-4 right-4">
                   <h3 className="text-base md:text-xl font-black text-white leading-tight line-clamp-2">{mag.title}</h3>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <p className="text-slate-400 text-[9px] md:text-xs font-medium mb-4 line-clamp-2 leading-relaxed">{mag.description}</p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-indigo-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">Ver Lição</span>
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-50 flex items-center justify-center text-[8px] font-black text-slate-400">{mag.pages.length}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
