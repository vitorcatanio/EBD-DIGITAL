
import React, { useState } from 'react';
import { User, Attendance, Announcement, Class, UserResponse, Magazine, Exercise, ExerciseType } from '../types';
import AuthoringModal from './AuthoringModal';

interface TeacherDashboardProps {
  user: User;
  students: User[];
  classes: Class[];
  attendances: Attendance[];
  announcements: Announcement[];
  responses: UserResponse[];
  magazines: Magazine[];
  onAddAnnouncement: (a: Announcement) => void;
  onToggleAttendance: (studentId: string, studentName: string, classId: string, isPresent: boolean) => void;
  onApproveStudent: (id: string) => void;
  onRejectStudent: (id: string) => void;
  onUpdateUser: (u: User) => void;
  onUpdateMagazine: (m: Magazine) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  user, students, classes, attendances, announcements, responses, magazines,
  onAddAnnouncement, onToggleAttendance, onApproveStudent, onRejectStudent, onUpdateUser, onUpdateMagazine
}) => {
  const [tab, setTab] = useState<'approvals' | 'performance' | 'activities' | 'announcements'>('performance');
  const [selectedMag, setSelectedMag] = useState<Magazine | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const pendingStudents = students.filter(s => !s.isApproved);

  const handleAddQuestion = (data: Partial<Exercise>) => {
    if (!selectedMag) return;
    const newEx: Exercise = {
      id: `ex-${Date.now()}`,
      type: data.type || ExerciseType.FREE_TEXT,
      question: data.question || '',
      options: data.options,
      x: 0, y: 0,
      createdAt: Date.now()
    };
    const updated = { ...selectedMag };
    updated.pages[0].exercises.push(newEx);
    onUpdateMagazine(updated);
    setIsAddingQuestion(false);
  };

  const handleRemoveQuestion = (exId: string) => {
    if (!selectedMag) return;
    const updated = { ...selectedMag };
    updated.pages[0].exercises = updated.pages[0].exercises.filter(ex => ex.id !== exId);
    onUpdateMagazine(updated);
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Gestão da Turma</h1>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Acesso do Professor: {user.name}</p>
         </div>
         <nav className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
            {[
               { id: 'performance', label: 'Desempenho' },
               { id: 'activities', label: 'Questionários' },
               { id: 'approvals', label: 'Novos Alunos', count: pendingStudents.length },
               { id: 'announcements', label: 'Avisos' }
            ].map(t => (
               <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                 {t.label} {t.count ? `(${t.count})` : ''}
               </button>
            ))}
         </nav>
      </header>

      {tab === 'approvals' && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h2 className="text-xl font-black uppercase tracking-tighter mb-8">Aprovação de Matrícula</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingStudents.map(s => (
                 <div key={s.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                    <div>
                       <h3 className="font-black text-slate-800 text-sm uppercase">{s.name}</h3>
                       <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Solicitou ingresso na sua turma</p>
                    </div>
                    <div className="flex space-x-2">
                       <button onClick={() => onApproveStudent(s.id)} className="bg-emerald-500 text-white p-3 rounded-xl hover:scale-110 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                       <button onClick={() => onRejectStudent(s.id)} className="bg-red-400 text-white p-3 rounded-xl hover:scale-110 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                 </div>
              ))}
              {pendingStudents.length === 0 && <div className="col-span-2 py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.2em]">Sem pendências.</div>}
           </div>
        </div>
      )}

      {tab === 'activities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
              <div className="p-6 border-b bg-slate-50"><h3 className="text-xs font-black uppercase tracking-widest">Escolha a Lição</h3></div>
              <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                 {magazines.map(m => (
                    <button key={m.id} onClick={() => setSelectedMag(m)} className={`w-full p-4 flex items-center space-x-3 text-left transition-all ${selectedMag?.id === m.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50'}`}>
                       <img src={m.coverUrl} className="w-8 h-10 object-cover rounded shadow-sm" />
                       <span className="font-black text-xs text-slate-700 truncate">{m.title}</span>
                    </button>
                 ))}
              </div>
           </div>

           <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
              {selectedMag ? (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                          <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedMag.title}</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questionários Anexos ({selectedMag.pages.flatMap(p=>p.exercises).length})</p>
                       </div>
                       <button onClick={() => setIsAddingQuestion(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">+ Questão</button>
                    </div>

                    <div className="space-y-4">
                       {selectedMag.pages.flatMap(p => p.exercises).map((ex, i) => (
                          <div key={ex.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between group">
                             <div>
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1 block">{ex.type}</span>
                                <p className="font-bold text-slate-800 text-sm">{ex.question}</p>
                                {ex.options && <p className="text-[9px] text-slate-400 mt-2 italic">{ex.options.join(', ')}</p>}
                             </div>
                             <button onClick={() => handleRemoveQuestion(ex.id)} className="text-red-300 hover:text-red-500 transition-colors p-2">Excluir</button>
                          </div>
                       ))}
                       {selectedMag.pages.flatMap(p=>p.exercises).length === 0 && <div className="py-16 text-center opacity-30 italic text-xs">Nenhuma questão adicionada a esta lição.</div>}
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center py-20 text-slate-300">
                    <span className="text-5xl">📌</span>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em]">Selecione uma lição para gerenciar</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Reuso do Modal de Criação */}
      <AuthoringModal isOpen={isAddingQuestion} onClose={() => setIsAddingQuestion(false)} onSave={handleAddQuestion} />
    </div>
  );
};

export default TeacherDashboard;
