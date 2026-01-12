import React, { useState, useRef } from 'react';
import { Class, Magazine, User, Attendance, Page } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configuração do Worker via CDN para evitar problemas de carregamento local
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
  const [tab, setTab] = useState<'content' | 'classes' | 'approvals' | 'reports' | 'teachers'>('content');
  const [newClassName, setNewClassName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newMagTitle, setNewMagTitle] = useState('');
  const [newMagClassId, setNewMagClassId] = useState('');
  const [pdfUrlInput, setPdfUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  const handleProcessMagazine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMagTitle || !newMagClassId) {
      alert("Preencha o título e a turma.");
      return;
    }

    if (!selectedFile && !pdfUrlInput) {
      alert("Selecione um arquivo PDF ou insira um link direto.");
      return;
    }

    setIsProcessing(true);
    try {
      let finalPdfUrl = pdfUrlInput;
      let arrayBuffer: ArrayBuffer;

      // 1. Obter os dados do PDF
      if (selectedFile) {
        // Se for arquivo local, verificamos o tamanho (limite Firestore de 1MB para Base64)
        if (selectedFile.size > 1024 * 1024) {
          throw new Error("O arquivo é muito grande para upload direto (>1MB). Por favor, use um link do Google Drive ou Dropbox.");
        }
        arrayBuffer = await selectedFile.arrayBuffer();
        // Converter para Base64 para salvar no Firestore já que o Storage não está disponível
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
        finalPdfUrl = base64;
      } else {
        // Se for URL, tentamos buscar para gerar a capa (pode falhar por CORS dependendo do host)
        try {
          const resp = await fetch(pdfUrlInput);
          arrayBuffer = await resp.arrayBuffer();
        } catch (e) {
          throw new Error("Não foi possível acessar o link do PDF para gerar a capa. Certifique-se de que é um link público e direto.");
        }
      }

      // 2. Processar PDF para gerar Capa e Contar Páginas
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      if (!ctx) throw new Error("Erro ao preparar renderização.");
      await page.render({ canvasContext: ctx, viewport }).promise;
      const coverUrl = canvas.toDataURL('image/jpeg', 0.6); // Qualidade 0.6 para economizar espaço

      const pages: Page[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pages.push({ 
          id: `p-${i}-${Date.now()}`, 
          pageNumber: i, 
          imageUrl: '', 
          exercises: [] 
        });
      }

      const newMagazine: Magazine = {
        id: `mag-${Date.now()}`,
        title: newMagTitle,
        description: `Lição disponível para a turma.`,
        coverUrl,
        pdfUrl: finalPdfUrl, 
        classId: newMagClassId,
        pages
      };

      await onAddMagazine(newMagazine);
      
      setIsUploading(false);
      setIsProcessing(false);
      setNewMagTitle('');
      setPdfUrlInput('');
      setSelectedFile(null);
      alert("Revista publicada com sucesso!");

    } catch (err: any) {
      console.error("Erro:", err);
      alert(err.message || "Erro ao processar. Tente usar um PDF menor ou um link direto.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 uppercase">Administração</h1>
          <p className="text-slate-500 font-medium text-[10px] md:text-sm">Controle total da plataforma.</p>
        </div>
        <nav className="flex bg-white p-1 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'content', label: 'Revistas' },
            { id: 'classes', label: 'Turmas' },
            { id: 'teachers', label: 'Professores' },
            { id: 'approvals', label: 'Aprovações', count: pendingTeachers.length },
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
            <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tighter">Acervo de Lições</h2>
            <button 
              onClick={() => setIsUploading(true)} 
              className="w-full md:w-auto bg-indigo-600 text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
              <span>+ PUBLICAR REVISTA</span>
            </button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50">
                   <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Capa / Título</th>
                   <th className="hidden md:table-cell px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Turma Alvo</th>
                   <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right tracking-widest">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {magazines.map(m => (
                   <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-8 py-4">
                       <div className="flex items-center space-x-4">
                         <img src={m.coverUrl} className="w-10 h-14 object-cover rounded shadow-md border border-slate-200" />
                         <span className="font-black text-slate-800 text-xs md:text-sm">{m.title}</span>
                       </div>
                     </td>
                     <td className="hidden md:table-cell px-8 py-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-wider">
                           {classes.find(c => c.id === m.classId)?.name || "Turma Geral"}
                        </span>
                     </td>
                     <td className="px-8 py-4 text-right space-x-4">
                       <button onClick={() => onSelectMagazine(m.id)} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">Abrir</button>
                       <button onClick={() => onDeleteMagazine(m.id)} className="text-red-400 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors">Excluir</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {magazines.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.2em]">Biblioteca Vazia</div>}
          </div>
        </section>
      )}

      {/* Reutilizando as outras abas conforme o código anterior... */}
      {tab === 'classes' && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Nova Turma</h3>
            <input 
              type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} 
              placeholder="Ex: Primários" 
              className="w-full border-b border-slate-100 py-2 outline-none focus:border-indigo-600 font-black text-center text-sm" 
            />
            <button onClick={() => { onAddClass(newClassName); setNewClassName(''); }} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Confirmar</button>
          </div>
          {classes.map(c => (
            <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center group relative hover:shadow-lg transition-all">
               <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
               <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter">{c.name}</h3>
               <button onClick={() => onDeleteClass(c.id)} className="mt-6 text-[9px] font-black text-red-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Excluir</button>
            </div>
          ))}
        </section>
      )}

      {/* Modal de Publicação - REMOVIDA DEPENDÊNCIA DO STORAGE */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleProcessMagazine} className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 md:p-12 space-y-6 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Publicar Material</h3>
                <button type="button" onClick={() => !isProcessing && setIsUploading(false)} className="text-slate-300 hover:text-slate-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             
             <div className="space-y-5">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Título da Lição</label>
                 <input required type="text" value={newMagTitle} onChange={e => setNewMagTitle(e.target.value)} placeholder="Ex: Trimestre 01 - Lição 05" className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm" />
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Turma Destino</label>
                 <select required value={newMagClassId} onChange={e => setNewMagClassId(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 appearance-none text-sm cursor-pointer">
                   <option value="">Selecione...</option>
                   {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
               </div>

               <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Opção 1: Link Direto do PDF (Recomendado)</label>
                    <input 
                      type="url" 
                      value={pdfUrlInput} 
                      onChange={e => { setPdfUrlInput(e.target.value); setSelectedFile(null); }} 
                      placeholder="https://drive.google.com/uc?id=ID_DO_ARQUIVO" 
                      className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-xs" 
                    />
                 </div>
                 
                 <div className="relative py-2 flex items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="px-3 text-[9px] font-black text-slate-300 uppercase">ou</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Opção 2: Arquivo Local (Máx 1MB)</label>
                    <div onClick={() => !isProcessing && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${selectedFile ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}>
                      <input type="file" ref={fileInputRef} hidden accept="application/pdf" onChange={e => { setSelectedFile(e.target.files?.[0] || null); setPdfUrlInput(''); }} />
                      <div className="text-3xl mb-2">📄</div>
                      <p className="font-black text-slate-700 text-xs truncate">{selectedFile ? selectedFile.name : 'Selecionar arquivo'}</p>
                    </div>
                 </div>
               </div>
             </div>
             
             <button type="submit" disabled={isProcessing || (!selectedFile && !pdfUrlInput)} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-95">
                 {isProcessing ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     <span>PROCESSANDO...</span>
                   </>
                 ) : 'PUBLICAR MATERIAL'}
             </button>
             <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">O material ficará disponível instantaneamente para os alunos.</p>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditorDashboard;