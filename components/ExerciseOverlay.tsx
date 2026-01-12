
import React, { useState } from 'react';
import { Page, UserRole, Exercise, ExerciseType, UserResponse } from '../types';
import DrawingCanvas from './DrawingCanvas';

interface ExerciseOverlayProps {
  page: Page;
  role: UserRole;
  userResponses: UserResponse[];
  onSave: (response: UserResponse) => void;
}

const ExerciseOverlay: React.FC<ExerciseOverlayProps> = ({ page, role, userResponses, onSave }) => {
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  const getResponse = (id: string) => userResponses.find(r => r.exerciseId === id);

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
                isCompleted ? 'bg-green-500 border-green-200 text-white' : 'bg-indigo-600 border-indigo-200 text-white'}
              ${activeExercise?.id === ex.id ? 'ring-4 ring-white scale-110' : ''}
            `}
            title={isLink ? `Link: ${ex.question}` : ex.question}
          >
            {isLink ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            ) : isCompleted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <span className="text-sm font-black">?</span>
            )}
          </button>
        );
      })}

      {activeExercise && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <span className="bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {activeExercise.type === ExerciseType.MULTIPLE_CHOICE ? 'Pergunta Objetiva' : 
                 activeExercise.type === ExerciseType.FREE_TEXT ? 'Pergunta Aberta' : 'Desenho Criativo'}
              </span>
              <button onClick={() => setActiveExercise(null)} className="text-stone-400 hover:text-stone-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8">
              <h3 className="text-xl font-bold text-stone-800 mb-8 leading-tight">{activeExercise.question}</h3>
              <ExerciseForm 
                exercise={activeExercise} 
                response={getResponse(activeExercise.id)}
                onSave={(val) => {
                  onSave({ exerciseId: activeExercise.id, answer: val, timestamp: Date.now() });
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

interface ExerciseFormProps {
  exercise: Exercise;
  response?: UserResponse;
  onSave: (val: any) => void;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({ exercise, response, onSave }) => {
  const [value, setValue] = useState(response?.answer || '');

  if (exercise.type === ExerciseType.MULTIPLE_CHOICE) {
    return (
      <div className="space-y-3">
        {exercise.options?.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => setValue(idx.toString())}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between
              ${value === idx.toString() ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-100' : 'border-stone-100 hover:border-stone-200 text-stone-600'}
            `}
          >
            <span className="font-bold text-sm">{opt}</span>
            {value === idx.toString() && (
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
        <button 
          onClick={() => onSave(value)}
          disabled={!value}
          className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100"
        >
          Confirmar Resposta
        </button>
      </div>
    );
  }

  if (exercise.type === ExerciseType.FREE_TEXT) {
    return (
      <div className="space-y-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Digite sua reflexão aqui..."
          className="w-full h-40 p-5 rounded-2xl border-2 border-stone-100 focus:border-indigo-500 focus:outline-none resize-none font-medium placeholder:text-stone-300"
        ></textarea>
        <button 
          onClick={() => onSave(value)}
          disabled={!value.trim()}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100"
        >
          Enviar Resposta
        </button>
      </div>
    );
  }

  if (exercise.type === ExerciseType.DRAWING) {
    return (
      <div className="space-y-4">
        <div className="aspect-video w-full rounded-2xl overflow-hidden border-2 border-stone-100 shadow-inner">
           <DrawingCanvas onSave={onSave} />
        </div>
      </div>
    );
  }

  return null;
};

export default ExerciseOverlay;
