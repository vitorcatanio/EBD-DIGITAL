
import React, { useState, useEffect, useCallback } from 'react';
import { Magazine, User, Comment, UserResponse, Exercise, ExerciseType } from '../types';
import ExerciseOverlay from './ExerciseOverlay';
import AuthoringModal from './AuthoringModal';

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

  const totalPages = magazine.pages.length;
  const currentPage = magazine.pages[currentPageIdx];

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
      {/* Content Area */}
      <div className={`flex-grow flex flex-col transition-all duration-500 h-full ${showForum ? 'md:mr-[400px]' : ''}`}>
        {/* Header Toolbar */}
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
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${editMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-600'}`}
               >
                 {editMode ? 'SALVAR' : 'EDITAR'}
               </button>
             )}

             <button 
              onClick={() => setShowForum(!showForum)}
              className={`p-2 rounded-lg transition-all relative ${showForum ? 'bg-indigo-100 text-indigo-600' : 'bg-white border text-slate-400'}`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
               {comments.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-bold">{comments.length}</span>}
             </button>
          </div>
        </div>

        {/* Reader Viewport */}
        <div className="flex-grow flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-slate-100">
          <div 
            onClick={(e) => {
              if (editMode) {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setAuthoringPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
              }
            }}
            className={`relative w-full h-full max-h-[80vh] md:max-h-[85vh] aspect-[1/1.414] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)] bg-white rounded-xl md:rounded-[2.5rem] overflow-hidden ${editMode ? 'cursor-crosshair border-4 border-indigo-500 animate-pulse' : ''}`}
          >
            {currentPage && (
              <div key={currentPageIdx} className="w-full h-full relative animate-in fade-in zoom-in-95 duration-500">
                <img src={currentPage.imageUrl} className="w-full h-full object-contain pointer-events-none select-none bg-slate-50" />
                <ExerciseOverlay 
                  page={currentPage} 
                  role={user.role === 'editor' ? 'teacher' : user.role} 
                  userResponses={[]} 
                  onSave={() => {}} 
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="absolute inset-x-0 bottom-10 flex justify-center space-x-12 md:space-x-0 md:contents">
             <button 
                disabled={currentPageIdx === 0}
                onClick={() => setCurrentPageIdx(p => p - 1)}
                className="md:absolute md:left-8 w-14 h-14 rounded-full bg-white/90 backdrop-blur shadow-xl flex items-center justify-center hover:bg-white disabled:opacity-0 transition-all z-40 active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                disabled={currentPageIdx === totalPages - 1}
                onClick={() => setCurrentPageIdx(p => p + 1)}
                className="md:absolute md:right-8 w-14 h-14 rounded-full bg-white/90 backdrop-blur shadow-xl flex items-center justify-center hover:bg-white disabled:opacity-0 transition-all z-40 active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
          </div>
        </div>

        {/* Page Slider */}
        <div className="h-16 flex items-center justify-center px-8 bg-white/50 backdrop-blur-sm">
           <div className="w-full max-w-lg flex items-center space-x-4">
              <span className="text-[10px] font-black text-slate-400">01</span>
              <input 
                type="range" min="0" max={totalPages - 1} value={currentPageIdx} onChange={e => setCurrentPageIdx(Number(e.target.value))}
                className="flex-grow accent-indigo-600"
              />
              <span className="text-[10px] font-black text-slate-400">{totalPages.toString().padStart(2, '0')}</span>
           </div>
        </div>
      </div>

      {/* Forum Sidebar Responsive */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-white border-l border-slate-200 shadow-2xl z-[100] flex flex-col transition-transform duration-500 ease-in-out ${showForum ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-black text-slate-800 uppercase tracking-tighter">Fórum da Lição</h3>
          <button onClick={() => setShowForum(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
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
          {comments.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <p className="font-black uppercase text-[10px] tracking-widest">Nenhum comentário<br/>Comece o debate!</p>
             </div>
          )}
        </div>

        <div className="p-6 border-t bg-white">
          <textarea 
            value={newComment} onChange={e => setNewComment(e.target.value)}
            placeholder="Comente algo..."
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 ring-indigo-500 outline-none resize-none mb-3"
            rows={3}
          ></textarea>
          <button 
            onClick={handlePostComment} disabled={!newComment.trim()}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100"
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
