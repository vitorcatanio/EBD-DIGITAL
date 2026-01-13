
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
  const [tab, setTab] = useState<'attendance' | 'performance' | 'activities' | 'announcements' | 'approvals'>('attendance');
  const [selectedMag, setSelectedMag] = useState<Magazine | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const pendingStudents = students.filter(s => !s.isApproved);
  const approvedStudents = students.filter(s => s.isApproved);
  const today = new Date().toISOString().split('T')[0];

  // Cálculo de Frequência
  const calculateFrequency = (studentId: string) => {
    const studentAtts = attendances.filter(a => a.userId === studentId);
    if (studentAtts.length === 0) return 0;
    const presents = studentAtts.filter(a => a.isPresent).length;
    return Math.round((presents / studentAtts.length) * 100);
  };

  const exportToExcel = () => {
    const headers = "Nome do Aluno,Frequencia %,Datas de Presenca\n";
    const rows = approvedStudents.map(s => {
      const freq = calculateFrequency(s.id);
      const dates = attendances
        .filter(a => a.userId === s.id && a.isPresent)
        .map(a => a.date)
        .join(' | ');
      return `${s.name},${freq}%,${dates}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_EBD_${user.classId}_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fix: Implemented handleRemoveQuestion to allow removing exercises from a magazine
  const handleRemoveQuestion = (exerciseId: string) => {
    if (!selectedMag) return;
    const updated = {
      ...selectedMag,
      pages: selectedMag.pages.map(p => ({
        ...p,
        exercises: p.exercises.filter(ex => ex.id !== exerciseId)
      }))
    };
    onUpdateMagazine(updated);
    setSelectedMag(updated);
  };

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
    if (!updated.pages[0].exercises) updated.pages[0].exercises = [];
    updated.pages[0].exercises.push(newEx);
    onUpdateMagazine(updated);
    setIsAddingQuestion(false);
    setSelectedMag(updated);
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
               { id: 'attendance', label: 'Chamada' },
               { id: 'performance', label: 'Desempenho' },
               { id: 'activities', label: 'Questionários' },
               { id: 'approvals', label: 'Pendentes', count: pendingStudents.length },
            ].map(t => (
               <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                 {t.label} {t.count ? `(${t.count})` : ''}
               </button>
            ))}
         </nav>
      </header>

      {tab === 'attendance' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter">Lista de Chamada</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <button 
              onClick={exportToExcel}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>Baixar Relatório Excel</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aluno</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Frequência</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right tracking-widest">Status de Hoje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {approvedStudents.map(s => {
                  const attToday = attendances.find(a => a.userId === s.id && a.date === today);
                  const isPresent = attToday?.isPresent || false;
                  const freq = calculateFrequency(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            {s.profilePicture ? <img src={s.profilePicture} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-slate-400">{s.name.charAt(0)}</span>}
                          </div>
                          <span className="font-bold text-slate-800 text-xs">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${freq > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${freq}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-400">{freq}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => onToggleAttendance(s.id, s.name, s.classId || '', !isPresent)}
                          className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isPresent ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200' : 'bg-slate-100 text-slate-400 border-2 border-slate-200'}`}
                        >
                          {isPresent ? 'Presente' : 'Ausente'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {approvedStudents.length === 0 && <div className="p-20 text-center opacity-20 font-black text-[10px] uppercase tracking-widest">Nenhum aluno matriculado na turma.</div>}
          </div>
        </div>
      )}

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
              {pendingStudents.length === 0 && <div className="col-span-2 py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.2em]">Sem pendências de aprovação.</div>}
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
                             <button onClick={() => handleRemoveQuestion(ex.id)} className="text-red-300 hover:text-red-500 transition-colors p-2 font-bold text-[10px] uppercase">Excluir</button>
                          </div>
                       ))}
                       {selectedMag.pages.flatMap(p=>p.exercises).length === 0 && <div className="py-16 text-center opacity-30 italic text-xs">Nenhuma questão adicionada.</div>}
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center py-20 text-slate-300">
                    <span className="text-5xl">📌</span>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em]">Selecione uma lição para gerenciar as questões</p>
                 </div>
              )}
           </div>
        </div>
      )}

      {tab === 'performance' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-fit">
               <div className="p-6 border-b bg-slate-50"><h2 className="text-xs font-black uppercase tracking-widest">Alunos</h2></div>
               <div className="divide-y divide-slate-50">
                  {approvedStudents.map(s => (
                     <button key={s.id} onClick={() => onUpdateUser(s)} className="w-full p-4 flex items-center space-x-3 hover:bg-slate-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center font-black text-indigo-600 text-[10px] overflow-hidden">
                           {s.profilePicture ? <img src={s.profilePicture} className="w-full h-full object-cover" /> : s.name.charAt(0)}
                        </div>
                        <div className="flex-grow min-w-0">
                           <div className="font-black text-slate-800 text-xs truncate">{s.name}</div>
                           <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              {responses.filter(r => r.userId === s.id).length} Atividades Realizadas
                           </div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>
            <div className="lg:col-span-2 py-20 bg-white rounded-[2.5rem] border border-slate-100 flex items-center justify-center opacity-30 font-black uppercase tracking-widest text-[10px]">
              Funcionalidade em desenvolvimento: Clique no aluno para detalhes.
            </div>
         </div>
      )}

      <AuthoringModal isOpen={isAddingQuestion} onClose={() => setIsAddingQuestion(false)} onSave={handleAddQuestion} />
    </div>
  );
};

export default TeacherDashboard;
