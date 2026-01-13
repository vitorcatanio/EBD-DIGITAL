
import React, { useState } from 'react';
import { User, Attendance, Announcement, Class, UserResponse, Magazine } from '../types';

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
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  user, students, classes, attendances, announcements, responses, magazines,
  onAddAnnouncement, onToggleAttendance, onApproveStudent, onRejectStudent, onUpdateUser 
}) => {
  const [tab, setTab] = useState<'attendance' | 'students' | 'performance' | 'announcements'>('performance');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Painel da Turma</h1>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Professor(a) {user.name}</p>
         </div>
         <nav className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
            {[
               { id: 'attendance', label: 'Chamada' },
               { id: 'performance', label: 'Desempenho' },
               { id: 'students', label: 'Alunos' },
               { id: 'announcements', label: 'Avisos' }
            ].map(t => (
               <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t.label}</button>
            ))}
         </nav>
      </header>

      {tab === 'performance' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-fit">
               <div className="p-6 border-b bg-slate-50"><h2 className="text-xs font-black uppercase tracking-widest">Alunos</h2></div>
               <div className="divide-y divide-slate-50">
                  {students.map(s => (
                     <button key={s.id} onClick={() => setSelectedStudent(s)} className={`w-full p-4 flex items-center space-x-3 hover:bg-slate-50 transition-colors text-left ${selectedStudent?.id === s.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center font-black text-indigo-600 text-[10px] overflow-hidden">
                           {s.profilePicture ? <img src={s.profilePicture} className="w-full h-full object-cover" /> : s.name.charAt(0)}
                        </div>
                        <div className="flex-grow min-w-0">
                           <div className="font-black text-slate-800 text-xs truncate">{s.name}</div>
                           <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              {responses.filter(r => r.userId === s.id).length} Respostas
                           </div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
               {selectedStudent ? (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-right-4">
                     <div className="flex items-center space-x-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white text-2xl overflow-hidden shadow-xl">
                           {selectedStudent.profilePicture ? <img src={selectedStudent.profilePicture} className="w-full h-full object-cover" /> : selectedStudent.name.charAt(0)}
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{selectedStudent.name}</h2>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Histórico de Atividades</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {responses.filter(r => r.userId === selectedStudent.id).length === 0 ? (
                           <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                              <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Nenhuma atividade realizada</p>
                           </div>
                        ) : (
                           responses.filter(r => r.userId === selectedStudent.id).map(r => {
                              const mag = magazines.find(m => m.id === r.magazineId);
                              return (
                                 <div key={r.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group">
                                    <div className="flex justify-between items-start mb-3">
                                       <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{mag?.title || 'Lição'}</span>
                                       <span className="text-[8px] font-bold text-slate-300 uppercase">{new Date(r.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-700 font-medium text-sm leading-relaxed">
                                       {Array.isArray(r.answer) ? r.answer.join(', ') : r.answer}
                                    </p>
                                 </div>
                              );
                           })
                        )}
                     </div>
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm opacity-50">
                     <div className="text-4xl mb-4">📈</div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Selecione um aluno para ver o desempenho</p>
                  </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
