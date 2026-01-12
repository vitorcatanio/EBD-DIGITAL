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
  const [newClassName, setNewClassName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newMagTitle, setNewMagTitle] = useState('');
  const [newMagClassId, setNewMagClassId] = useState('');
  const [pdfUrlInput, setPdfUrlInput] = useState('');
  const [manualPageCount, setManualPageCount] = useState('10');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualCover, setManualCover] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Função para converter link do Drive para link direto de download
  const convertDriveLink = (url: string) => {
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }
    return url;
  };

  const handleManualCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setManualCover(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProcessMagazine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMagTitle || !newMagClassId) {
      alert("Preencha o título e a turma.");
      return;
    }

    setIsProcessing(true);
    try {
      let finalPdfUrl = convertDriveLink(pdfUrlInput);
      let coverUrl = manualCover || '';
      let numPages = parseInt(manualPageCount) || 10;

      if (selectedFile) {
        if (selectedFile.size > 1024 * 1024) {
          throw new Error("Arquivo muito grande. Use um link do Google Drive.");
        }
        const arrayBuffer = await selectedFile.arrayBuffer();
        try {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          numPages = pdf.numPages;
          if (!manualCover) {
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.0 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            if (ctx) {
              await page.render({ canvasContext: ctx, viewport }).promise;
              coverUrl = canvas.toDataURL('image/jpeg', 0.6);
            }
          }
        } catch (e) {
          console.error("Erro ao ler PDF local:", e);
        }

        finalPdfUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      } else if (pdfUrlInput) {
        // Tentativa de ler PDF externo para pegar capa e número de páginas
        // O Google Drive costuma bloquear isso (CORS), por isso o try/catch
        try {
          const resp = await fetch(finalPdfUrl);
          if (resp.ok) {
            const arrayBuffer = await resp.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            numPages = pdf.numPages;
            if (!manualCover) {
              const page = await pdf.getPage(1);
              const viewport = page.getViewport({ scale: 0.5 });
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              if (ctx) {
                await page.render({ canvasContext: ctx, viewport }).promise;
                coverUrl = canvas.toDataURL('image/jpeg', 0.5);
              }
            }
          }
        } catch (e) {
          console.warn("CORS ou erro de rede ao ler PDF externo. Usando dados manuais.");
        }
      }

      const pages: Page[] = [];
      for (let i = 1; i <= numPages; i++) {
        pages.push({ id: `p-${i}-${Date.now()}`, pageNumber: i, imageUrl: '', exercises: [] });
      }

      const newMagazine: Magazine = {
        id: `mag-${Date.now()}`,
        title: newMagTitle,
        description: `Lição disponível para a turma.`,
        coverUrl: coverUrl || 'https://via.placeholder.com/300x400?text=EBD+DIGITAL',
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
      setManualCover(null);
      alert("Revista publicada com sucesso!");

    } catch (err: any) {
      console.error("Erro:", err);
      alert(err.message || "Erro ao processar.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 uppercase">Administração</h1>
          <p className="text-slate-500 font-medium text-[10px] md:text-sm">Gestão de conteúdo.</p>
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
                   <th className="hidden md:table-cell px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Turma</th>
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
                           {classes.find(c => c.id === m.classId)?.name || "Geral"}
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
             {magazines.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.2em]">Nenhum material postado</div>}
          </div>
        </section>
      )}

      {isUploading && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <form onSubmit={handleProcessMagazine} className="bg-white w-full max-w-xl rounded-[2.5rem] p-6 md:p-10 space-y-5 shadow-2xl animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Novo Material</h3>
                <button type="button" onClick={() => !isProcessing && setIsUploading(false)} className="text-slate-300 hover:text-slate-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Título</label>
                 <input required type="text" value={newMagTitle} onChange={e => setNewMagTitle(e.target.value)} placeholder="Lição 01 - Exemplo" className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Turma</label>
                   <select required value={newMagClassId} onChange={e => setNewMagClassId(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-sm cursor-pointer appearance-none">
                     <option value="">Selecione...</option>
                     {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Qtd. de Páginas</label>
                   <input type="number" value={manualPageCount} onChange={e => setManualPageCount(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-slate-100 font-bold text-sm" />
                 </div>
               </div>

               <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center space-x-4">
                  <div 
                    onClick={() => coverInputRef.current?.click()}
                    className="w-16 h-20 bg-white border-2 border-dashed border-indigo-200 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white transition-all shadow-sm"
                  >
                    {manualCover ? <img src={manualCover} className="w-full h-full object-cover" /> : <span className="text-xl">🖼️</span>}
                    <input type="file" ref={coverInputRef} hidden accept="image/*" onChange={handleManualCoverUpload} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Capa da Revista</p>
                    <p className="text-[9px] text-slate-500 font-medium leading-tight">Carregue a imagem da capa aqui para garantir que ela apareça na biblioteca.</p>
                  </div>
               </div>

               <div className="space-y-4 pt-2">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Link do Google Drive / Dropbox</label>
                    <input 
                      type="url" 
                      value={pdfUrlInput} 
                      onChange={e => { setPdfUrlInput(e.target.value); setSelectedFile(null); }} 
                      placeholder="Cole o link do Drive aqui" 
                      className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold border border-slate-100 text-xs" 
                    />
                    <div className="mt-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                       <p className="text-[9px] text-amber-700 font-bold leading-tight uppercase">Dica: O link deve ser do tipo "Qualquer pessoa com o link". Nós converteremos o link de "visualização" para "download" automaticamente.</p>
                    </div>
                 </div>
                 
                 <div className="relative py-1 flex items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="px-3 text-[9px] font-black text-slate-300 uppercase">ou</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Arquivo Local (Máx 1MB)</label>
                    <div onClick={() => !isProcessing && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${selectedFile ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}>
                      <input type="file" ref={fileInputRef} hidden accept="application/pdf" onChange={e => { setSelectedFile(e.target.files?.[0] || null); setPdfUrlInput(''); }} />
                      <div className="text-2xl mb-1">📄</div>
                      <p className="font-black text-slate-700 text-xs truncate">{selectedFile ? selectedFile.name : 'Selecionar PDF local'}</p>
                    </div>
                 </div>
               </div>
             </div>
             
             <button type="submit" disabled={isProcessing || (!selectedFile && !pdfUrlInput)} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-95">
                 {isProcessing ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     <span>PUBLICANDO...</span>
                   </>
                 ) : 'SALVAR NO ACERVO'}
             </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditorDashboard;