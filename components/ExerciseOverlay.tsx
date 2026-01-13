
import React, { useState } from 'react';
import { Page, UserRole, Exercise, ExerciseType, UserResponse, Magazine } from '../types';
import DrawingCanvas from './DrawingCanvas';

interface ExerciseOverlayProps {
  page: Page;
  magazine: Magazine;
  role: UserRole;
  user: any;
  userResponses: UserResponse[];
  onSave: (response: UserResponse) => void;
}

const ExerciseOverlay: React.FC<ExerciseOverlayProps> = ({ page, magazine, role, user, userResponses, onSave }) => {
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  const getResponse = (id: string) => userResponses.find(r => r.exerciseId === id && r.userId === user.id);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {page.exercises.map((ex) => {
        const response = getResponse(ex.id);
        const isCompleted = !!response;
        const isLink = ex.type === ExerciseType.HYPERLINK;

        return (
          <button
            key={ex.id}
            onClick={(e) => {
              e.stopPropagation();
              if (isLink && ex.url) {
                window.open(ex.url, '_blank');
              } else {
                setActiveExercise(ex);
              }
            }}
            style={{ left: `${ex.x}%`, top: `${ex.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-4 shadow-xl flex items-center justify-center transition-all hover:scale-125 pointer-events-auto
              ${isLink ? 'bg-amber-400 border-amber-200 text-amber-900' : 
                isCompleted ? 'bg-emerald-500 border-emerald-100 text-white' : 'bg-indigo-600 border-indigo-200 text-white animate-bounce-slow'}
            `}
          >
             {isCompleted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            ) : <span className="text-xs font-black">EX</span>}
          </button>
        );
      })}

      {activeExercise && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Atividade Interativa</span>
                <h3 className="text-lg font-black text-slate-800 mt-2 leading-tight">{activeExercise.question}</h3>
              </div>
              <button onClick={() => setActiveExercise(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8">
              <ExerciseForm 
                exercise={activeExercise} 
                response={getResponse(activeExercise.id)}
                onSave={(val) => {
                  onSave({ 
                    id: `resp-${Date.now()}`,
                    magazineId: magazine.id,
                    exerciseId: activeExercise.id, 
                    userId: user.id,
                    userName: user.name,
                    answer: val, 
                    timestamp: Date.now() 
                  });
                  setActiveExercise(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExerciseForm: React.FC<{ exercise: Exercise, response?: UserResponse, onSave: (val: any) => void }> = ({ exercise, response, onSave }) => {
  const [value, setValue] = useState<any>(response?.answer || (exercise.type === ExerciseType.CHECKBOXES ? [] : ''));

  const handleSubmit = () => onSave(value);

  if (exercise.type === ExerciseType.MULTIPLE_CHOICE) {
    return (
      <div className="space-y-3">
        {exercise.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => setValue(i.toString())}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${value === i.toString() ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}
          >
            <span className="font-bold text-sm">{opt}</span>
            {value === i.toString() && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>}
          </button>
        ))}
        <button onClick={handleSubmit} disabled={!value} className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">Confirmar</button>
      </div>
    );
  }

  if (exercise.type === ExerciseType.CHECKBOXES) {
     const toggle = (opt: string) => {
        const current = Array.isArray(value) ? value : [];
        setValue(current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt]);
     };
     return (
        <div className="space-y-3">
           {exercise.options?.map((opt, i) => (
              <button key={i} onClick={() => toggle(opt)} className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${value?.includes?.(opt) ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}>
                 <span className="font-bold text-sm">{opt}</span>
                 <div className={`w-5 h-5 rounded border-2 ${value?.includes?.(opt) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
                    {value?.includes?.(opt) && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                 </div>
              </button>
           ))}
           <button onClick={handleSubmit} className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Enviar Respostas</button>
        </div>
     );
  }

  if (exercise.type === ExerciseType.FREE_TEXT) {
    return (
      <div className="space-y-4">
        <textarea value={value} onChange={e => setValue(e.target.value)} placeholder="Sua resposta..." className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 ring-indigo-500 outline-none font-medium" />
        <button onClick={handleSubmit} disabled={!value.trim()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Enviar</button>
      </div>
    );
  }

  return null;
};

export default ExerciseOverlay;
