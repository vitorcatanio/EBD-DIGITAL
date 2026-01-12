
import React, { useEffect, useState } from 'react';

interface IntroductionProps {
  onComplete: () => void;
}

const Introduction: React.FC<IntroductionProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 400),   
      setTimeout(() => setStep(2), 1200),  
      setTimeout(() => setStep(3), 2000),  
      setTimeout(() => setStep(4), 4000),  
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[500] flex flex-col items-center justify-center p-4 overflow-hidden select-none touch-none">
      {/* Background Atmospheric */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1)_0%,transparent_70%)]"></div>
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-sm text-center relative z-10 flex flex-col items-center">
        
        {/* Animated Logo Shield */}
        <div className={`transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) transform ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50 translate-y-10'}`}>
          <div className="relative mb-6">
             <div className="absolute inset-[-10px] bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
             <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center relative shadow-2xl border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
             </div>
          </div>
        </div>

        {/* Title */}
        <div className={`transition-all duration-1000 transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4 flex items-center justify-center gap-2">
            EBD <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">DIGITAL</span>
          </h1>
        </div>

        {/* Feature Sequence */}
        <div className="h-20 relative w-full flex items-center justify-center mb-6 overflow-hidden">
           <div className={`absolute transition-all duration-700 transform ${step === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="flex flex-col items-center">
                 <span className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Conhecimento</span>
                 <p className="text-slate-400 text-sm md:text-lg font-medium">Estudo Bíblico Interativo</p>
              </div>
           </div>
           
           <div className={`absolute transition-all duration-1000 transform ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <p className="text-slate-500 text-[10px] md:text-base font-medium max-w-[240px] mx-auto px-4">
                Pronto para transformar sua experiência na Escola Bíblica?
              </p>
           </div>
        </div>

        {/* Action Button */}
        <div className={`w-full px-6 transition-all duration-1000 transform ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button 
            onClick={onComplete}
            className="group relative w-full bg-white text-slate-950 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-50 transition-all active:scale-95 overflow-hidden"
          >
            <span className="relative z-10">Entrar no App</span>
            <div className="absolute inset-0 bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Introduction;