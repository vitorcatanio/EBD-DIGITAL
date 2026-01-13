
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
  userResponses: UserResponse[];
  onAddComment: (c: Comment) => void;
  onSaveResponse: (r: UserResponse) => void;
  onClose: () => void;
  onUpdateMagazine: (m: Magazine) => void;
}

const MagazineReader: React.FC<MagazineReaderProps> = ({ 
  magazine, user, comments, userResponses, onAddComment, onSaveResponse, onClose, onUpdateMagazine 
}) => {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [activeSidePanel, setActiveSidePanel] = useState<'none' | 'forum' | 'activities'>('none');
  const [newComment, setNewComment] = useState('');
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [useIframeMode, setUseIframeMode] = useState(false);
  const pdfDocRef = useRef<any>(null);
  const [pdfPageImage, setPdfPageImage] = useState<string | null>(null);

  const totalPages = magazine.pages.length;
  const currentPage = magazine.pages[currentPageIdx];

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      const id = url.match(/\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
      return `https://drive.google.com/file/d/${id}/preview?rm=minimal`;
    }
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  useEffect(() => {
    const loadPdf = async () => {
      if (!magazine.pdfUrl) return;
      setIsLoadingPage(true);
      try {
        const loadingTask = pdfjsLib.getDocument(magazine.pdfUrl);
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        await renderPage(0);
        setUseIframeMode(false);
      } catch (e: any) {
        setUseIframeMode(true);
      } finally {
        setIsLoadingPage(false);
      }
    };
    loadPdf();
  }, [magazine.pdfUrl]);

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
    } catch (e) { console.error(e); }
    finally { setIsLoadingPage(false); }
  };

  const allExercises = magazine.pages.flatMap(p => p.exercises);

  return (
    <div className="flex-grow flex bg-slate-900 overflow-hidden relative flex-col md:flex-row h-full w-full">
      <div className={`flex-grow flex flex-col transition-all duration-500 h-full w-full ${activeSidePanel !== 'none' ? 'md:mr-[400px]' : ''}`}>
        
        <div className="bg-white px-4 md:px-6 py-3 border-b border-slate-200 flex items-center justify-between z-50 shrink-0">
          <div className="flex items-center space-x-4 min-w-0">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <div className="truncate">
              <h2 className="font-black text-slate-800 tracking-tight leading-none mb-1 truncate text-sm md:text-base uppercase">{magazine.title}</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{useIframeMode ? 'Visualizador Integrado' : `Pág. ${currentPageIdx + 1} / ${totalPages}`}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
             <button 
              onClick={() => setActiveSidePanel(activeSidePanel === 'activities' ? 'none' : 'activities')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all ${activeSidePanel === 'activities' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
               <span className="hidden md:inline uppercase tracking-widest">Atividades</span>
               {allExercises.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[8px]">{allExercises.length}</span>}
             </button>

             <button 
              onClick={() => setActiveSidePanel(activeSidePanel === 'forum' ? 'none' : 'forum')}
              className={`p-2 rounded-xl transition-all ${activeSidePanel === 'forum' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             </button>
          </div>
        </div>

        <div className="flex-grow relative bg-slate-950 w-full overflow-hidden flex flex-col">
          <iframe src={getEmbedUrl(magazine.pdfUrl || '')} className="w-full h-full border-none" allow="autoplay" />
        </div>
      </div>

      {/* Painéis Laterais */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-white border-l border-slate-200 shadow-2xl z-[100] flex flex-col transition-transform duration-500 ${activeSidePanel !== 'none' ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {activeSidePanel === 'forum' && (
          <>
            <div className="p-6 border-b bg-slate-50 flex items-center justify-between shrink-0">
              <h3 className="font-black text-slate-800 uppercase tracking-tighter">Debate Bíblico</h3>
              <button onClick={() => setActiveSidePanel('none')} className="p-2 hover:bg-white rounded-xl text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {comments.map(c => (<div key={c.id} className="animate-in slide-in-from-right-2 duration-300"><div className="flex items-center space-x-2 mb-1"><span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{c.userName}</span></div><p className="text-slate-700 text-sm p-4 bg-slate-50 rounded-2xl border border-slate-100">{c.text}</p></div>))}
              {comments.length === 0 && <p className="text-center py-10 text-slate-300 text-xs italic">Seja o primeiro a comentar.</p>}
            </div>
            <div className="p-6 border-t bg-white shrink-0">
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Sua dúvida..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 ring-indigo-500 outline-none resize-none mb-3" rows={3} />
              <button onClick={() => { onAddComment({ id: Date.now().toString(), magazineId: magazine.id, userId: user.id, userName: user.name, text: newComment, timestamp: Date.now() }); setNewComment(''); }} disabled={!newComment.trim()} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100">POSTAR</button>
            </div>
          </>
        )}

        {activeSidePanel === 'activities' && (
          <>
            <div className="p-6 border-b bg-indigo-600 flex items-center justify-between shrink-0 text-white">
              <h3 className="font-black uppercase tracking-tighter">Atividades Anexas</h3>
              <button onClick={() => setActiveSidePanel('none')} className="p-2 hover:bg-white/10 rounded-xl text-white/50"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50">
              {allExercises.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-4xl">📝</span>
                  <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nenhuma questão disponível.</p>
                </div>
              ) : (
                allExercises.map((ex, idx) => {
                  const resp = userResponses.find(r => r.exerciseId === ex.id && r.userId === user.id);
                  return (
                    <div key={ex.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in duration-300">
                      <div className="flex items-center space-x-2 mb-3">
                         <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                         <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{ex.type}</span>
                         {resp && <span className="ml-auto text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> Concluído</span>}
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-4">{ex.question}</h4>
                      
                      <ExerciseSimpleForm 
                        exercise={ex} 
                        response={resp} 
                        onSave={(val) => onSaveResponse({ id: Date.now().toString(), magazineId: magazine.id, exerciseId: ex.id, userId: user.id, userName: user.name, answer: val, timestamp: Date.now() })} 
                      />
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ExerciseSimpleForm: React.FC<{ exercise: Exercise, response?: UserResponse, onSave: (val: any) => void }> = ({ exercise, response, onSave }) => {
  const [val, setVal] = useState<any>(response?.answer || (exercise.type === ExerciseType.CHECKBOXES ? [] : ''));

  if (response) {
    return (
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-500 text-xs">
        {Array.isArray(response.answer) ? response.answer.join(', ') : response.answer}
      </div>
    );
  }

  if (exercise.type === ExerciseType.MULTIPLE_CHOICE) {
    return (
      <div className="space-y-2">
        {exercise.options?.map((opt, i) => (
          <button key={i} onClick={() => onSave(opt)} className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 text-[11px] font-bold transition-all">{opt}</button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea value={val} onChange={e => setVal(e.target.value)} placeholder="Sua resposta..." className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 ring-indigo-500 min-h-[80px]" />
      <button onClick={() => onSave(val)} disabled={!val} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest">Enviar Resposta</button>
    </div>
  );
};

export default MagazineReader;
