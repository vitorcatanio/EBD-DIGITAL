
import React, { useState, useRef } from 'react';
import { Class, Magazine, User, Attendance, Page } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import { storage, db } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

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
  const [tab, setTab] = useState<'content' | 'classes' | 'approvals' | 'reports' | 'teachers'>('content');
  const [newClassName, setNewClassName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newMagTitle, setNewMagTitle] = useState('');
  const [newMagClassId, setNewMagClassId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    onAddClass(newClassName);
    setNewClassName('');
  };

  const handleProcessPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !newMagTitle || !newMagClassId) return;
    setIsProcessing(true);
    try {
      // 1. Upload do PDF para o Firebase Storage
      const pdfRef = ref(storage, `magazines/${Date.now()}_${selectedFile.name}`);
      const uploadResult = await uploadBytes(pdfRef, selectedFile);
      const pdfUrl = await getDownloadURL(uploadResult.ref);

      // 2. Processar a primeira página para gerar a capa
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
      const coverUrl = canvas.toDataURL('image/jpeg', 0.7);

      // 3. Criar a estrutura das páginas (inicialmente vazias ou referenciando o PDF)
      const pages: Page[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pages.push({ 
          id: `p-${i}-${Date.now()}`, 
          pageNumber: i, 
          imageUrl: '', // Será renderizado no leitor a partir do PDF URL
          exercises: [] 
        });
      }

      const magId = `mag-${Date.now()}`;
      const newMagazine: Magazine = {
        id: magId,
        title: newMagTitle,
        description: `Publicado em ${new Date().toLocaleDateString()}`,
        coverUrl,
        pdfUrl, // Guardamos a URL do PDF original
        classId: newMagClassId,
        pages
      };

      // 4. Salvar no Firestore
      await setDoc(doc(db, 'magazines', magId), newMagazine);
      
      onAddMagazine(newMagazine);
      setIsUploading(false);
      setIsProcessing(false);
      setNewMagTitle('');
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar e salvar no Firebase");
      setIsProcessing(false);
    }
  };

  const handleSaveTeacherEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      onUpdateUser(editingTeacher);
      setEditingTeacher(null);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 uppercase">Administração</h1>
          <p className="text-slate-500 font-medium text-[10px] md:text-sm">Gestão de conteúdo e turmas.</p>
        </div>
        <nav className="flex bg-white p-1 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'content', label: 'Revistas' },
            { id: 'classes', label: 'Turmas' },
            { id: 'teachers', label: 'Professores' },
            { id: 'approvals', label: 'Aprovações', count: pendingTeachers.length },
            { id: 'reports', label: 'Dados' }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-2.5 md:px-5 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              {t.label} {t.count ? `(${t.count})` : ''}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'content' && (
        <section className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 md:p-10 border-b flex flex-col md:flex-row items-center justify-between gap-4">
            <h2 className="text-lg md:text-xl font-black text-slate-800">Lições Ativas</h2>
            <button 
              onClick={() => setIsUploading(true)} 
              className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              <span>+ NOVA REVISTA</span>
            </button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-50">
                 <tr>
                   <th className="px-5 py-3 md:px-8 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Revista</th>
                   <th className="hidden sm:table-cell px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Turma</th>
                   <th className="px-5 py-3 md:px-8 md:py-4 text-[9px] md:text-[10px] font-black uppercase text-slate-400 text-right tracking-widest">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {magazines.map(m => (
                   <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                     <td className="px-5 py-4 md:px-8 md:py-5">
                       <div className="flex items-center space-x-3">
                         <img src={m.coverUrl} className="w-8 h-12 object-cover rounded shadow-sm" />
                         <span className="font-bold text-slate-800 text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{m.title}</span>
                       </div>
                     </td>
                     <td className="hidden sm:table-cell px-8 py-5">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-full uppercase">{m.classId}</span>
                     </td>
                     <td className="px-5 py-4 md:px-8 md:py-5 text-right space-x-2 md:space-x-4">
                       <button onClick={() => onSelectMagazine(m.id)} className="text-indigo-600 font-black text-[9px] md:text-[10px] uppercase hover:underline">Ver</button>
                       <button onClick={() => onDeleteMagazine(m.id)} className="text-red-400 font-black text-[9px] md:text-[10px] uppercase hover:underline">Deletar</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {magazines.length === 0 && <div className="py-16 text-center text-slate-300 italic text-xs">Nenhuma revista postada.</div>}
          </div>
        </section>
      )}

      {tab === 'approvals' && (
        <section className="space-y-3 max-w-2xl mx-auto">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Pendentes de Aprovação</h2>
          {pendingTeachers.map(t => (
            <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm animate-in slide-in-from-bottom-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center font-black text-amber-600 text-sm overflow-hidden">
                   {t.profilePicture ? <img src={t.profilePicture} className="w-full h-full object-cover" /> : t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-black text-slate-800 text-sm leading-tight">{t.name}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Professor - Turma: {t.classId}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onApproveTeacher(t.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Aprovar</button>
                <button onClick={() => onRejectTeacher(t.id)} className="bg-slate-50 text-slate-400 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Recusar</button>
              </div>
            </div>
          ))}
          {pendingTeachers.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
              <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Nenhuma solicitação de professor</p>
            </div>
          )}
        </section>
      )}

      {tab === 'classes' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="font-black text-slate-800 uppercase text-[9px] md:text-xs tracking-widest">Adicionar Turma</h3>
            <input 
              type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} 
              placeholder="Ex: Jovens" 
              className="w-full border-b border-slate-100 py-2 outline-none focus:border-indigo-600 font-black text-center text-sm transition-all" 
            />
            <button onClick={handleAddClass} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest">Confirmar</button>
          </div>
          {classes.map(c => (
            <div key={c.id} className="bg-white p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center group relative overflow-hidden transition-all hover:shadow-md">
               <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎓</div>
               <h3 className="font-black text-slate-800 text-sm md:text-lg uppercase tracking-tighter">{c.name}</h3>
               <button onClick={() => onDeleteClass(c.id)} className="mt-4 text-[8px] md:text-[9px] font-black text-red-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:text-red-600">Excluir</button>
            </div>
          ))}
        </section>
      )}

      {tab === 'teachers' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {teachers.map(t => (
            <div key={t.id} className="bg-white p-5 md:p-8 rounded-xl md:rounded-[2rem] border border-slate-100 shadow-sm group">
               <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-lg md:rounded-xl flex items-center justify-center font-black text-lg text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden">
                    {t.profilePicture ? <img src={t.profilePicture} className="w-full h-full object-cover" /> : t.name.charAt(0)}
                 </div>
                 <button onClick={() => setEditingTeacher(t)} className="p-1 text-slate-200 hover:text-indigo-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 </button>
               </div>
               <div className="font-black text-slate-800 text-[10px] md:text-sm leading-none truncate">{t.name}</div>
               <div className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Turma: {t.classId}</div>
            </div>
          ))}
          {teachers.length === 0 && <div className="col-span-full py-10 text-center text-slate-300 italic text-xs">Nenhum professor registrado.</div>}
        </div>
      )}

      {/* Modal de Edição de Professor */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <form onSubmit={handleSaveTeacherEdit} className="bg-white w-full max-sm rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-tighter">Editar Professor</h3>
                <button type="button" onClick={() => setEditingTeacher(null)} className="text-slate-300 hover:text-slate-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             
             <div className="space-y-4">
                <div>
                   <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Nome Completo</label>
                   <input required type="text" value={editingTeacher.name} onChange={e => setEditingTeacher({...editingTeacher, name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm" />
                </div>
                <div>
                   <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Nova Senha</label>
                   <input type="password" value={editingTeacher.password || ''} onChange={e => setEditingTeacher({...editingTeacher, password: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm" />
                </div>
                <div>
                   <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1 block">Turma Responsável</label>
                   <select value={editingTeacher.classId} onChange={e => setEditingTeacher({...editingTeacher, classId: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm appearance-none">
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
             </div>
             
             <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg uppercase tracking-widest text-[10px]">Salvar Alterações</button>
          </form>
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleProcessPDF} className="bg-white w-full max-w-lg rounded-3xl p-6 md:p-10 space-y-6 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center">
                <h3 className="text-xl md:text-2xl font-black tracking-tighter text-slate-900">Upload de Lição</h3>
                <button type="button" onClick={() => setIsUploading(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             
             <div className="space-y-4">
               <input required type="text" value={newMagTitle} onChange={e => setNewMagTitle(e.target.value)} placeholder="Título da Lição" className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm" />
               <select required value={newMagClassId} onChange={e => setNewMagClassId(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 appearance-none text-sm">
                 <option value="">Destinar para Turma...</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-100 rounded-2xl p-6 md:p-10 text-center cursor-pointer hover:bg-slate-50 transition-all group">
                 <input type="file" ref={fileInputRef} hidden accept="application/pdf" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                 <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">📄</div>
                 <p className="font-black text-slate-800 text-[10px] md:text-xs truncate">{selectedFile ? selectedFile.name : 'Selecionar arquivo PDF'}</p>
                 <p className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Converta seu material em digital</p>
               </div>
             </div>
             
             <button type="submit" disabled={isProcessing || !selectedFile} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg shadow-indigo-100 uppercase tracking-widest text-[10px] disabled:opacity-50 transition-all">
                 {isProcessing ? 'Processando...' : 'Publicar Agora'}
             </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditorDashboard;
