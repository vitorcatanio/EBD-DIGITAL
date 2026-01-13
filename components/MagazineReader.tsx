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
  const [useIframeMode, setUseIframeMode] = useState(false);
  const pdfDocRef = useRef<any>(null);

  const totalPages = magazine.pages.length;
  const currentPage = magazine.pages[currentPageIdx];

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      const id = url.match(/\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
      // Preview mode do drive ocupa melhor o espaço do iframe
      return `https://drive.google.com/file/d/${id}/preview`;
    }
    // Fallback usando visualizador do Google Docs para outros links diretos
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  useEffect(() => {
    const loadPdf = async () => {
      if (!magazine.pdfUrl) return;
      
      setIsLoadingPage(true);
      try {
        // Tentativa de carregar via motor interno (PDF.js)
        const loadingTask = pdfjsLib.getDocument(magazine.pdfUrl);
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        await renderPage(0);
        setUseIframeMode(false);
      } catch (e: any) {
        // Se falhar (CORS do Drive), mudamos para o modo Iframe (Tela Cheia)
        console.warn("Modo interativo falhou. Ativando Visualizador de Tela Cheia.");
        setUseIframeMode(true);
      } finally {
        setIsLoadingPage(false);
      }
    };
    loadPdf();
  }, [magazine.pdfUrl]);

  useEffect(() => {
    if (pdfDocRef.current && !useIframeMode) {
      renderPage(currentPageIdx);
    }
  }, [currentPageIdx, useIframeMode]);

  const renderPage = async (idx: number) => {
    if (!pdfDocRef.current) return;
    setIsLoadingPage(true);
    try {
      const page = await pdfDocRef.current.getPage(idx + 1);
      const viewport = page.getViewport({ scale: 1.5 }); 
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
    <div className="flex-grow flex bg-slate-900 overflow-hidden relative flex-col md:flex-row h-full">
      <div className={`flex-grow flex flex-col transition-all duration-500 h-full ${showForum ? 'md:mr-[400px]' : ''}`}>
        
        {/* Header Superior */}
        <div className="bg-white px-4 md:px-6 py-3 border-b border-slate-200 flex items-center justify-between z-50">
          <div className="flex items-center space-x-4 min-w-0">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0 text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="truncate">
              <h2 className="font-black text-slate-800 tracking-tight leading-none mb-1 truncate text-sm md:text-base uppercase">{magazine.title}</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {useIframeMode ? 'Visualizador Integrado' : `Página ${currentPageIdx + 1} / ${totalPages}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
             {!useIframeMode && user.role === 'teacher' && (
               <button 
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${editMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-indigo-600'}`}
               >
                 {editMode ? 'SALVAR' : 'ADICIONAR PERGUNTA'}
               </button>
             )}

             <button 
              onClick={() => setShowForum(!showForum)}
              className={`p-2 rounded-lg transition-all relative ${showForum ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-400 hover:text-indigo-600'}`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             </button>
          </div>
        </div>

        {/* Área Principal de Visualização */}
        <div className="flex-grow flex items-center justify-center p-0 relative overflow-hidden bg-slate-900">
          {useIframeMode ? (
            <div className="w-full h-full animate-in fade-in duration-500">
              <iframe 
                src={getEmbedUrl(magazine.pdfUrl || '')} 
                className="w-full h-full border-none shadow-2xl"
                title="Visualizador de PDF em Tela Cheia"
                allow="autoplay"
              />
            </div>
          ) : (
            <div 
              onClick={(e) => {
                if (editMode) {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setAuthoringPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
                }
              }}
              className={`relative w-full h-full max-h-[90vh] aspect-[1/1.414] shadow-2xl bg-white md:rounded-lg overflow-hidden ${editMode ? 'cursor-crosshair border-4 border-indigo-500' : ''}`}
            >
              {isLoadingPage ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 space-y-4">
                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Sincronizando...</p>
                 </div>
              ) : pdfPageImage ? (
                <div key={currentPageIdx} className="w-full h-full relative animate-in fade-in duration-500">
                  <img src={pdfPageImage} className="w-full h-full object-contain pointer-events-none select-none bg-white" />
                  <ExerciseOverlay 
                    page={currentPage} 
                    role={user.role === 'editor' ? 'teacher' : user.role} 
                    userResponses={[]} 
                    onSave={() => {}} 
                  />
                </div>
              ) : null}
            </div>
          )}

          {/* Navegação Manual (Só aparece no modo motor interno) */}
          {!useIframeMode && (
            <>
              <button 
                disabled={currentPageIdx === 0 || isLoadingPage}
                onClick={() => setCurrentPageIdx(p => p - 1)}
                className="absolute left-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all z-40 disabled:opacity-0 border border-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                disabled={currentPageIdx === totalPages - 1 || isLoadingPage}
                onClick={() => setCurrentPageIdx(p => p + 1)}
                className="absolute right-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all z-40 disabled:opacity-0 border border-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>

        {/* Rodapé de progresso (Só no modo motor interno) */}
        {!useIframeMode && (
          <div className="h-12 flex items-center justify-center px-8 bg-white border-t border-slate-200">
             <div className="w-full max-w-md flex items-center space-x-4">
                <span className="text-[10px] font-black text-slate-400">{(currentPageIdx + 1)}</span>
                <input 
                  type="range" min="0" max={totalPages - 1} value={currentPageIdx} onChange={e => setCurrentPageIdx(Number(e.target.value))}
                  className="flex-grow accent-indigo-600 h-1 rounded-lg bg-slate-100 appearance-none cursor-pointer"
                />
                <span className="text-[10px] font-black text-slate-400">{totalPages}</span>
             </div>
          </div>
        )}
      </div>

      {/* Sidebar do Forum/Comentários */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-white border-l border-slate-200 shadow-2xl z-[100] flex flex-col transition-transform duration-500 ease-in-out ${showForum ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-black text-slate-800 uppercase tracking-tighter">Debate</h3>
          <button onClick={() => setShowForum(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {comments.map(c => (
            <div key={c.id}>
              <div className="flex items-center space-x-2 mb-1">
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{c.userName}</span>
              </div>
              <p className="text-slate-700 text-sm p-4 bg-slate-50 rounded-2xl border border-slate-100">{c.text}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-center py-10 text-slate-300 text-xs italic">Nenhum comentário.</p>}
        </div>

        <div className="p-6 border-t bg-white">
          <textarea 
            value={newComment} onChange={e => setNewComment(e.target.value)}
            placeholder="Sua dúvida..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 ring-indigo-500 outline-none resize-none mb-3"
            rows={3}
          ></textarea>
          <button 
            onClick={handlePostComment} disabled={!newComment.trim()}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-[10px]"
          >
            ENVIAR
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