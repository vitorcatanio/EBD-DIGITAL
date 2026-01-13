
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
    onSave({ 
      type, 
      question, 
      options: (type === ExerciseType.MULTIPLE_CHOICE || type === ExerciseType.CHECKBOXES) ? options.filter(o => o.trim() !== '') : undefined,
      url: type === ExerciseType.HYPERLINK ? url : undefined,
      createdAt: Date.now()
    });
    onClose();
    setQuestion('');
    setOptions(['', '', '']);
    setUrl('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase">Criar Questão</h2>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">Ferramenta Pedagógica</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-3">
             {[
               { id: ExerciseType.MULTIPLE_CHOICE, label: 'Múltipla Escolha' },
               { id: ExerciseType.CHECKBOXES, label: 'Assinalar' },
               { id: ExerciseType.FREE_TEXT, label: 'Dissertativa' },
               { id: ExerciseType.HYPERLINK, label: 'Link Externo' }
             ].map(t => (
               <button key={t.id} onClick={() => setType(t.id)} className={`py-3 px-4 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all ${type === t.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-50 text-slate-400 hover:border-slate-100'}`}>{t.label}</button>
             ))}
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Enunciado</label>
             <input type="text" value={question} onChange={e => setQuestion(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm" placeholder="O que você quer perguntar?" />
          </div>

          {(type === ExerciseType.MULTIPLE_CHOICE || type === ExerciseType.CHECKBOXES) && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Opções de Resposta</label>
              {options.map((opt, i) => (
                <div key={i} className="flex space-x-2">
                   <input type="text" value={opt} onChange={e => {
                     const n = [...options]; n[i] = e.target.value; setOptions(n);
                   }} className="flex-grow p-3 bg-slate-50 rounded-xl outline-none text-xs font-bold border border-slate-100" placeholder={`Opção ${i+1}`} />
                   {options.length > 2 && <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="p-3 text-red-300 hover:text-red-500">×</button>}
                </div>
              ))}
              <button onClick={() => setOptions([...options, ''])} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">+ Adicionar Opção</button>
            </div>
          )}

          <button onClick={handleSave} disabled={!question} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 active:scale-95 transition-all">Inserir na Lição</button>
        </div>
      </div>
    </div>
  );
};

export default AuthoringModal;
