
import React, { useState } from 'react';
import { User, Attendance, Announcement, Class } from '../types';

interface TeacherDashboardProps {
  user: User;
  students: User[];
  classes: Class[];
  attendances: Attendance[];
  announcements: Announcement[];
  onAddAnnouncement: (a: Announcement) => void;
  onToggleAttendance: (studentId: string, studentName: string, classId: string, isPresent: boolean) => void;
  onApproveStudent: (id: string) => void;
  onRejectStudent: (id: string) => void;
  onUpdateUser: (u: User) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  user, students, classes, attendances, announcements, onAddAnnouncement, 
  onToggleAttendance, onApproveStudent, onRejectStudent, onUpdateUser 
}) => {
  const [tab, setTab] = useState<'attendance' | 'students' | 'approvals' | 'announcements'>('attendance');
  const [newTitle, setNewTitle] = useState('');
  const [newMsg, setNewMsg] = useState('');
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  const approvedStudents = students.filter(s => s.isApproved);
  const pendingStudents = students.filter(s => !s.isApproved);
  const today = new Date().toISOString().split('T')[0];

  const handlePostAnnouncement = () => {
    if (!newTitle || !newMsg) return;
    onAddAnnouncement({
      id: `ann-${Date.now()}`,
      classId: user.classId!,
      title: newTitle,
      message: newMsg,
      date: new Date().toLocaleDateString(),
      authorName: user.name
    });
    setNewTitle('');
    setNewMsg('');
    setTab('announcements');
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      onUpdateUser(editingStudent);
      setEditingStudent(null);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6 animate-in fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 uppercase">Minha Turma</h1>
          <p className="text-indigo-600 font-bold uppercase text-[9px] tracking-widest mt-0.5">Turma: {user.classId}</p>
        </div>

        <nav className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'attendance', label: 'Chamada' },
            { id: 'students', label: 'Alunos' },
            { id: 'approvals', label: 'Solicitações', count: pendingStudents.length },
            { id: 'announcements', label: 'Avisos' }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              {t.label} {t.count ? `(${t.count})` : ''}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'attendance' && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Chamada do Dia</h2>
            <span className="text-[9px] font-bold text-slate-400">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {approvedStudents.map(s => {
              const isPresent = attendances.some(a => a.userId === s.id && a.date === today && a.isPresent);
              return (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 overflow-hidden flex items-center justify-center font-black text-indigo-400 text-xs">
                      {s.profilePicture ? <img src={s.profilePicture} className="w-full h-full object-cover" /> : s.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                  </div>
                  <button 
                    onClick={() => onToggleAttendance(s.id, s.name, user.classId!, !isPresent)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${isPresent ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
                  >
                    {isPresent ? 'Presente' : 'Ausente'}
                  </button>
                </div>
              );
            })}
            {approvedStudents.length === 0 && <div className="p-10 text-center text-slate-300 italic text-xs">Nenhum aluno aprovado nesta turma.</div>}
          </div>
        </section>
      )}

      {tab === 'approvals' && (
        <section className="space-y-3">
          {pendingStudents.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm animate-in slide-in-from-bottom-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600 text-sm overflow-hidden">
                   {s.profilePicture ? <img src={s.profilePicture} className="w-full h-full object-cover" /> : s.name.charAt(0)}
                </div>
                <div>
                  <div className="font-black text-slate-800 text-sm leading-tight">{s.name}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Quer entrar na turma</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onApproveStudent(s.id)} className="bg-emerald-500 text-white p-2 rounded-lg shadow-md hover:bg-emerald-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </button>
                <button onClick={() => onRejectStudent(s.id)} className="bg-red-50 text-red-400 p-2 rounded-lg hover:bg-red-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
          {pendingStudents.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
              <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Nenhuma solicitação pendente</p>
            </div>
          )}
        </section>
      )}

      {tab === 'students' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {approvedStudents.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group relative overflow-hidden">
               <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden">
                    {s.profilePicture ? <img src={s.profilePicture} className="w-full h-full object-cover" /> : s.name.charAt(0)}
                 </div>
                 <button onClick={() => setEditingStudent(s)} className="p-1.5 text-slate-200 hover:text-indigo-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 </button>
               </div>
               <div className="font-black text-slate-800 text-xs truncate leading-none">{s.name}</div>
               <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Aluno Ativo</div>
            </div>
          ))}
          {approvedStudents.length === 0 && <div className="col-span-full py-10 text-center text-slate-300 italic text-xs">Nenhum aluno na turma.</div>}
        </div>
      )}

      {tab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest">Novo Comunicado</h2>
            <div className="space-y-3">
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título" className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold text-xs" />
              <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} rows={3} placeholder="Mensagem..." className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold text-xs resize-none" />
              <button onClick={handlePostAnnouncement} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">Publicar</button>
            </div>
          </section>
          <section className="space-y-3">
             <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Histórico</h2>
             <div className="space-y-3 overflow-y-auto max-h-[300px] no-scrollbar">
               {announcements.map(a => (
                 <div key={a.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                   <h3 className="font-black text-indigo-600 text-[10px] uppercase">{a.title}</h3>
                   <p className="text-slate-500 text-xs mt-1 leading-relaxed">{a.message}</p>
                   <div className="mt-2 text-[8px] font-bold text-slate-300 uppercase">{a.date}</div>
                 </div>
               ))}
               {announcements.length === 0 && <p className="text-center py-10 text-slate-300 italic text-xs">Sem avisos.</p>}
             </div>
          </section>
        </div>
      )}

      {/* Modal de Edição de Aluno */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <form onSubmit={handleSaveStudentEdit} className="bg-white w-full max-w-sm rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-tighter">Editar Aluno</h3>
                <button type="button" onClick={() => setEditingStudent(null)} className="text-slate-300 hover:text-slate-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             
             <div className="space-y-4">
                <div>
                   <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Nome Completo</label>
                   <input required type="text" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm" />
                </div>
                <div>
                   <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Nova Senha (deixe vazio para manter)</label>
                   <input type="password" value={editingStudent.password || ''} onChange={e => setEditingStudent({...editingStudent, password: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm" />
                </div>
                <div>
                   <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Turma</label>
                   <select value={editingStudent.classId} onChange={e => setEditingStudent({...editingStudent, classId: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm appearance-none">
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
             </div>
             
             <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg uppercase tracking-widest text-[10px]">Salvar Alterações</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
