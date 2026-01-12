import React, { useState, useEffect, useRef } from 'react';
import { Magazine, User, Comment, UserResponse, Exercise, ExerciseType } from '../types';
import ExerciseOverlay from './ExerciseOverlay';
import AuthoringModal from './AuthoringModal';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface MagazineReaderProps {
  magazine: Magazine;
  user: User;
  comments: Comment[];
  onAddComment: (c: Comment) => void;
  onDeleteComment: (id: string) => void;
  onClose: () => void;
  onUpdateMagazine: (m: Magazine) => void;
}

const MagazineReader: React.FC<MagazineReaderProps> = ({ magazine, user, comments, onAddComment, onDeleteComment, onClose, onUpdateMagazine }) => {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [showForum, setShowForum] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [authoringPos, setAuthoringPos] = useState<{ x: number, y: number } | null>(null);
  const [pdfPageImage, setPdfPageImage] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pdfDocRef = useRef<any>(null);

  const totalPages = magazine.pages.length;
  const currentPage = magazine.pages[currentPageIdx];

  useEffect(() => {
    const loadPdf = async () => {
      if (!magazine.pdfUrl) {
        setLoadError("URL do PDF não encontrada.");
        return;
      }
      setIsLoadingPage(true);
      try {
        console.log("Baixando PDF...");
        const loadingTask = pdfjsLib.getDocument(magazine.pdfUrl);
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        await renderPage(0);
      } catch (e: any) {
        console.error("Erro ao carregar PDF:", e);
        // O erro "Invalid PDF structure" geralmente ocorre se o link retornar HTML em vez de PDF.
        // Links do Google Drive costumam ter bloqueio de CORS que impede o PDF.js de ler diretamente.
        setLoadError("O navegador bloqueou a exibição direta deste arquivo (CORS) ou o link é inválido. Tente clicar no botão abaixo para baixar ou ver o material original.");
      } finally {
        setIsLoadingPage(false);
      }
    };
    loadPdf();
  }, [magazine.pdfUrl]);

  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(currentPageIdx);
    }
  }, [currentPageIdx]);

  const renderPage = async (idx: number) => {
    if (!pdfDocRef.current) return;
    setIsLoadingPage(true);
    try {
      const page = await pdfDocRef.current.getPage(idx + 1);
      const viewport = page.getViewport({ scale: 2.0 }); 
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        setPdfPageImage(canvas.toDataURL('image/jpeg', 0.8));
      }
    } catch (e) {
      console.error("Erro ao renderizar página:", e);
    } finally {
      setIsLoadingPage(false);
    }
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    onAddComment({
      id: `c-${Date.now()}`,
      magazineId: magazine.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.profilePicture,
      text: newComment,
      timestamp: Date.now()
    });
    setNewComment('');
  };

  const handleAddInteraction = (interaction: Partial<Exercise>) => {
    if (!authoringPos) return;
    const ex: Exercise = {
      id: `ex-${Date.now()}`,
      type: interaction.type || ExerciseType.MULTIPLE_CHOICE,
      question: interaction.question || '',
      options: interaction.options,
      url: interaction.url,
      x: authoringPos.x,
      y: authoringPos.y
    };
    const updatedPages = [...magazine.pages];
    updatedPages[currentPageIdx].exercises.push(ex);
    onUpdateMagazine({ ...magazine, pages: updatedPages });
    setAuthoringPos(null);
  };

  return (
    <div className="flex-grow flex bg-slate-100 overflow-hidden relative flex-col md:flex-row">
      <div className={`flex-grow flex flex-col transition-all duration-500 h-full ${showForum ? 'md:mr-[400px]' : ''}`}>
        <div className="bg-white px-4 md:px-6 py-3 border-b border-slate-200 flex items-center justify-between z-50">
          <div className="flex items-center space-x-4 min-w-0">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <div className="truncate">
              <h2 className="font-black text-slate-800 tracking-tight leading-none mb-1 truncate text-sm md:text-base">{magazine.title}</h2>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Página {currentPageIdx + 1} / {totalPages}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
             {user.role === 'teacher' && (
               <button 
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${editMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-indigo-600'}`}
               >
                 {editMode ? 'SALVAR' : 'ADICIONAR PERGUNTA'}
               </button>
             )}

             <button 
              onClick={() => setShowForum(!showForum)}
              className={`p-2 rounded-lg transition-all relative ${showForum ? 'bg-indigo-100 text-indigo-600' : 'bg-white border text-slate-400'}`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             </button>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-slate-100">
          {loadError ? (
            <div className="text-center p-10 bg-white rounded-3xl shadow-xl max-w-md animate-in zoom-in">
               <div className="text-5xl mb-6">📂</div>
               <h3 className="font-black text-slate-800 uppercase mb-4 text-lg">Visualização Bloqueada</h3>
               <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8">{loadError}</p>
               <div className="flex flex-col space-y-3">
                 <a 
                   href={magazine.pdfUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="bg-indigo-600 text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 text-center"
                 >
                   Abrir Material Externo
                 </a>
                 <button onClick={onClose} className="text-slate-400 font-black text-[10px] uppercase tracking-widest py-2">Voltar para Biblioteca</button>
               </div>
            </div>
          ) : (
            <div 
              onClick={(e) => {
                if (editMode) {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setAuthoringPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
                }
              }}
              className={`relative w-full h-full max-h-[80vh] md:max-h-[85vh] aspect-[1/1.414] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)] bg-white rounded-xl md:rounded-[2.5rem] overflow-hidden ${editMode ? 'cursor-crosshair border-4 border-indigo-500 ring-8 ring-indigo-500/20' : ''}`}
            >
              {isLoadingPage ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 space-y-4">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] animate-pulse">Buscando Lição...</p>
                 </div>
              ) : pdfPageImage ? (
                <div key={currentPageIdx} className="w-full h-full relative animate-in fade-in duration-500">
                  <img src={pdfPageImage} className="w-full h-full object-contain pointer-events-none select-none bg-slate-50" />
                  <ExerciseOverlay 
                    page={currentPage} 
                    role={user.role === 'editor' ? 'teacher' : user.role} 
                    userResponses={[]} 
                    onSave={() => {}} 
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                   <div className="text-4xl">📄</div>
                   <p className="font-black text-[10px] uppercase tracking-widest">Aguardando arquivo...</p>
                </div>
              )}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-10 flex justify-center space-x-12 md:space-x-0 md:contents">
             <button 
                disabled={currentPageIdx === 0 || isLoadingPage}
                onClick={() => setCurrentPageIdx(p => p - 1)}
                className="md:absolute md:left-8 w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center hover:scale-110 disabled:opacity-0 transition-all z-40 active:scale-95 border border-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                disabled={currentPageIdx === totalPages - 1 || isLoadingPage}
                onClick={() => setCurrentPageIdx(p => p + 1)}
                className="md:absolute md:right-8 w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center hover:scale-110 disabled:opacity-0 transition-all z-40 active:scale-95 border border-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
          </div>
        </div>

        <div className="h-16 flex items-center justify-center px-8 bg-white border-t border-slate-100">
           <div className="w-full max-w-md flex items-center space-x-6">
              <span className="text-[10px] font-black text-slate-300">{(currentPageIdx + 1).toString().padStart(2, '0')}</span>
              <input 
                type="range" min="0" max={totalPages - 1} value={currentPageIdx} onChange={e => setCurrentPageIdx(Number(e.target.value))}
                className="flex-grow accent-indigo-600 h-1.5 rounded-lg bg-slate-100 appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-black text-slate-300">{totalPages.toString().padStart(2, '0')}</span>
           </div>
        </div>
      </div>

      <div className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-white border-l border-slate-200 shadow-2xl z-[100] flex flex-col transition-transform duration-500 ease-in-out ${showForum ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-black text-slate-800 uppercase tracking-tighter">Debate da Lição</h3>
          <button onClick={() => setShowForum(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {comments.map(c => (
            <div key={c.id} className="animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                   <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden">
                      {c.userAvatar ? <img src={c.userAvatar} className="w-full h-full object-cover" /> : <span className="text-[8px] font-black">{c.userName.charAt(0)}</span>}
                   </div>
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{c.userName}</span>
                </div>
                <span className="text-[8px] font-bold text-slate-300">{new Date(c.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed p-4 bg-slate-50 rounded-2xl border border-slate-100">{c.text}</p>
            </div>
          ))}
        </div>

        <div className="p-6 border-t bg-white">
          <textarea 
            value={newComment} onChange={e => setNewComment(e.target.value)}
            placeholder="Digite sua dúvida ou comentário..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 ring-indigo-500 outline-none resize-none mb-3"
            rows={3}
          ></textarea>
          <button 
            onClick={handlePostComment} disabled={!newComment.trim()}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[10px]"
          >
            ENVIAR COMENTÁRIO
          </button>
        </div>
      </div>

      <AuthoringModal 
        isOpen={!!authoringPos} 
        onClose={() => setAuthoringPos(null)} 
        onSave={handleAddInteraction} 
      />
    </div>
  );
};

export default MagazineReader;