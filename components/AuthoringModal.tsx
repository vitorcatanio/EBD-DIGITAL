
import React, { useState } from 'react';
import { ExerciseType, Exercise } from '../types';

interface AuthoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Exercise>) => void;
}

const AuthoringModal: React.FC<AuthoringModalProps> = ({ isOpen, onClose, onSave }) => {
  const [type, setType] = useState<ExerciseType>(ExerciseType.MULTIPLE_CHOICE);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [url, setUrl] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (type === ExerciseType.HYPERLINK) {
      onSave({ type, question, url });
    } else if (type === ExerciseType.MULTIPLE_CHOICE) {
      onSave({ type, question, options: options.filter(o => o.trim() !== '') });
    } else {
      onSave({ type, question });
    }
    // Reset fields
    setQuestion('');
    setOptions(['', '', '']);
    setUrl('');
  };

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-purple-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Nova Interação</h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Tipo de Interação</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: ExerciseType.MULTIPLE_CHOICE, label: 'Múltipla Escolha' },
                { id: ExerciseType.FREE_TEXT, label: 'Dissertativa' },
                { id: ExerciseType.DRAWING, label: 'Desenho' },
                { id: ExerciseType.HYPERLINK, label: 'Hiperlink' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${type === t.id ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-stone-100 text-stone-500 hover:border-stone-200'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Título / Pergunta</label>
            <input 
              type="text" 
              value={question} 
              onChange={e => setQuestion(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-stone-100 focus:border-purple-500 focus:outline-none"
              placeholder={type === ExerciseType.HYPERLINK ? "Título do link" : "Qual a pergunta?"}
            />
          </div>

          {type === ExerciseType.MULTIPLE_CHOICE && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Opções de Resposta</label>
              {options.map((opt, i) => (
                <input 
                  key={i}
                  type="text"
                  value={opt}
                  onChange={e => {
                    const newOpts = [...options];
                    newOpts[i] = e.target.value;
                    setOptions(newOpts);
                  }}
                  className="w-full p-3 rounded-xl border border-stone-100 focus:border-purple-300 focus:outline-none text-sm"
                  placeholder={`Opção ${i + 1}`}
                />
              ))}
              <button 
                onClick={() => setOptions([...options, ''])}
                className="text-purple-600 text-xs font-bold hover:underline"
              >
                + Adicionar Opção
              </button>
            </div>
          )}

          {type === ExerciseType.HYPERLINK && (
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">URL Destino</label>
              <input 
                type="url" 
                value={url} 
                onChange={e => setUrl(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-stone-100 focus:border-purple-500 focus:outline-none"
                placeholder="https://exemplo.com"
              />
            </div>
          )}

          <button 
            onClick={handleSave}
            disabled={!question || (type === ExerciseType.HYPERLINK && !url)}
            className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-xl shadow-purple-200"
          >
            Salvar Interação na Página
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthoringModal;
