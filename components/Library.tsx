
import React from 'react';
import { Magazine, User, Attendance } from '../types';

interface LibraryProps {
  magazines: Magazine[];
  onSelect: (id: string) => void;
  user: User;
  attendances?: Attendance[];
}

const Library: React.FC<LibraryProps> = ({ magazines, onSelect, user, attendances = [] }) => {
  
  // Cálculo de Frequência Individual
  const calculateFrequency = () => {
    const studentAtts = attendances.filter(a => a.userId === user.id);
    if (studentAtts.length === 0) return 0;
    const presents = studentAtts.filter(a => a.isPresent).length;
    return Math.round((presents / studentAtts.length) * 100);
  };

  const frequency = calculateFrequency();

  return (
    <div className="px-4 py-6 md:px-10 md:py-12 max-w-7xl mx-auto space-y-6 md:space-y-10">
      
      {/* Aluno Header / Status Card */}
      {user.role === 'student' && (
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-top-4 duration-700">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>

          <div className="relative z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none mb-4">Paz do Senhor, {user.name.split(' ')[0]}!</h1>
            <p className="text-indigo-100 font-bold text-xs md:text-sm uppercase tracking-widest opacity-80">Continue firme nos seus estudos bíblicos.</p>
          </div>

          <div className="md:ml-auto bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-w-[200px] text-center relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-60">Sua Frequência</span>
            <div className="text-4xl font-black mb-3">{frequency}%</div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${frequency}%` }}></div>
            </div>
            <p className="text-[9px] font-bold mt-3 opacity-60 uppercase tracking-widest">{frequency >= 75 ? 'Excelente Desempenho!' : 'Aumente sua presença.'}</p>
          </div>
        </div>
      )}

      {user.role !== 'student' && (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-1">
          <div className="space-y-0">
            <h1 className="text-2xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">Minhas Lições</h1>
            <p className="text-slate-500 font-medium text-xs md:text-lg">
              Bem-vindo de volta, <span className="text-indigo-600 font-bold">{user.name}</span>.
            </p>
          </div>
          <div className="hidden lg:block">
             <span className="bg-slate-200/50 text-slate-500 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">Painel Digital</span>
          </div>
        </header>
      )}

      {magazines.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
          <div className="text-5xl mb-6 opacity-20">📖</div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Aguardando liberação de conteúdo para sua turma.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-8">
          {magazines.map((mag) => (
            <div 
              key={mag.id}
              onClick={() => onSelect(mag.id)}
              className="group cursor-pointer bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full transform hover:-translate-y-2"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-50">
                <img src={mag.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-6 left-6 right-6">
                   <h3 className="text-base md:text-xl font-black text-white leading-tight line-clamp-2 uppercase tracking-tighter">{mag.title}</h3>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <p className="text-slate-400 text-[9px] md:text-xs font-medium mb-6 line-clamp-2 leading-relaxed">{mag.description}</p>
                <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-50">
                  <span className="text-indigo-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">Abrir Estudo</span>
                  <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[9px] font-black text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </div>
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
