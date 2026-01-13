
import React, { useState, useRef } from 'react';
import { Class, Magazine, User, Attendance, Page } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface EditorDashboardProps {
  classes: Class[];
  onAddClass: (name: string) => void;
  onDeleteClass: (id: string) => void;
  onUpdateClass: (id: string, name: string) => void;
  magazines: Magazine[];
  onAddMagazine: (m: Magazine) => void;
  onUpdateMagazine: (m: Magazine) => void;
  onDeleteMagazine: (id: string) => void;
  onSelectMagazine: (id: string) => void;
  pendingTeachers: User[];
  onApproveTeacher: (id: string) => void;
  onRejectTeacher: (id: string) => void;
  attendances: Attendance[];
  onUpdateUser: (u: User) => void;
  teachers: User[];
}

const EditorDashboard: React.FC<EditorDashboardProps> = ({ 
  classes, onAddClass, onDeleteClass, onUpdateClass, 
  magazines, onAddMagazine, onUpdateMagazine, onDeleteMagazine, onSelectMagazine,
  pendingTeachers, onApproveTeacher, onRejectTeacher, attendances,
  onUpdateUser, teachers
}) => {
  const [tab, setTab] = useState<'content' | 'classes' | 'approvals' | 'teachers'>('content');
  const [editingMag, setEditingMag] = useState<Magazine | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Forms states
  const [newMagTitle, setNewMagTitle] = useState('');
  const [newMagClassId, setNewMagClassId] = useState('');
  const [pdfUrlInput, setPdfUrlInput] = useState('');
  const [manualCover, setManualCover] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const startEdit = (m: Magazine) => {
    setEditingMag(m);
    setNewMagTitle(m.title);
    setNewMagClassId(m.classId);
    setPdfUrlInput(m.pdfUrl || '');
    setManualCover(m.coverUrl);
    setIsUploading(true);
  };

  const handleSaveMagazine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      if (editingMag) {
        await onUpdateMagazine({
          ...editingMag,
          title: newMagTitle,
          classId: newMagClassId,
          pdfUrl: pdfUrlInput,
          coverUrl: manualCover || editingMag.coverUrl
        });
      } else {
        const pages: Page[] = Array.from({ length: 10 }, (_, i) => ({ id: `p-${i}-${Date.now()}`, pageNumber: i + 1, imageUrl: '', exercises: [] }));
        await onAddMagazine({
          id: `mag-${Date.now()}`,
          title: newMagTitle,
          description: "Nova lição publicada.",
          classId: newMagClassId,
          pdfUrl: pdfUrlInput,
          coverUrl: manualCover || 'https://via.placeholder.com/300x400',
          pages
        });
      }
      resetForm();
    } catch (err) { alert("Erro ao salvar."); }
    finally { setIsProcessing(false); }
  };

  const resetForm = () => {
    setIsUploading(false);
    setEditingMag(null);
    setNewMagTitle('');
    setNewMagClassId('');
    setPdfUrlInput('');
    setManualCover(null);
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">Coordenação</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Painel Administrativo EBD Digital</p>
        </div>
        <nav className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {[
            { id: 'content', label: 'Revistas' },
            { id: 'classes', label: 'Turmas' },
            { id: 'approvals', label: 'Aprovações', count: pendingTeachers.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              {t.label} {t.count ? `(${t.count})` : ''}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'content' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tighter">Biblioteca do Sistema</h2>
            <button onClick={() => { resetForm(); setIsUploading(true); }} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-all">+ Nova Revista</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Material</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Destino</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-right tracking-widest">Gerenciar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {magazines.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="px-8 py-4">
                    <div className="flex items-center space-x-4">
                      <img src={m.coverUrl} className="w-10 h-14 object-cover rounded shadow-md" />
                      <span className="font-black text-slate-800 text-xs">{m.title}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-full">{classes.find(c => c.id === m.classId)?.name || 'Sem Turma'}</span>
                  </td>
                  <td className="px-8 py-4 text-right space-x-3">
                    <button onClick={() => startEdit(m)} className="text-indigo-600 font-black text-[9px] uppercase tracking-widest hover:bg-indigo-50 px-3 py-2 rounded-lg">Editar</button>
                    <button onClick={() => onDeleteMagazine(m.id)} className="text-red-400 font-black text-[9px] uppercase tracking-widest hover:bg-red-50 px-3 py-2 rounded-lg">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'approvals' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8">
           <h2 className="text-xl font-black uppercase tracking-tighter mb-8">Novos Professores Aguardando</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTeachers.map(t => (
                <div key={t.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm uppercase">{t.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Turma: {classes.find(c => c.id === t.classId)?.name || 'N/A'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => onApproveTeacher(t.id)} className="bg-emerald-500 text-white p-3 rounded-xl hover:scale-105 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                    <button onClick={() => onRejectTeacher(t.id)} className="bg-red-400 text-white p-3 rounded-xl hover:scale-105 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </div>
              ))}
              {pendingTeachers.length === 0 && <div className="col-span-2 py-20 text-center opacity-30 font-black uppercase text-[10px] tracking-widest">Nenhuma aprovação pendente.</div>}
           </div>
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleSaveMagazine} className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 space-y-6 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black tracking-tighter uppercase">{editingMag ? 'Editar Revista' : 'Novo Material'}</h3>
                <button type="button" onClick={resetForm} className="text-slate-300 hover:text-slate-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             
             <div className="space-y-4">
                <input required type="text" value={newMagTitle} onChange={e => setNewMagTitle(e.target.value)} placeholder="Título da Lição" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold outline-none focus:ring-2 ring-indigo-500" />
                <select required value={newMagClassId} onChange={e => setNewMagClassId(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold outline-none focus:ring-2 ring-indigo-500">
                  <option value="">Selecione a Turma</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input required type="url" value={pdfUrlInput} onChange={e => setPdfUrlInput(e.target.value)} placeholder="Link do PDF (Google Drive / Online)" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold outline-none focus:ring-2 ring-indigo-500 text-xs" />
                
                <div className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div onClick={() => coverInputRef.current?.click()} className="w-16 h-20 bg-white rounded-lg border-2 border-dashed border-indigo-200 flex items-center justify-center cursor-pointer overflow-hidden">
                    {manualCover ? <img src={manualCover} className="w-full h-full object-cover" /> : <span className="text-xl">🖼️</span>}
                    <input type="file" ref={coverInputRef} hidden accept="image/*" onChange={e => {
                      const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = () => setManualCover(r.result as string); r.readAsDataURL(f); }
                    }} />
                  </div>
                  <div><p className="text-[10px] font-black text-indigo-600 uppercase">Capa da Revista</p><p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Clique ao lado para carregar</p></div>
                </div>
             </div>
             
             <button type="submit" disabled={isProcessing} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-95 transition-all">
                {isProcessing ? 'Sincronizando...' : 'Publicar Lição'}
             </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditorDashboard;
