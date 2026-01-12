
import React, { useState, useRef } from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onGoHome: () => void;
  onOpenDashboard: () => void;
  onUpdateUser: (u: User) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onGoHome, onOpenDashboard, onUpdateUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ ...user, profilePicture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-[100] flex items-center justify-between">
        <button onClick={onGoHome} className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:rotate-12 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter">EBD <span className="text-indigo-600">DIGITAL</span></span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={onGoHome} className="text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors">Biblioteca</button>
          {(user.role === 'teacher' || user.role === 'editor') && (
            <button onClick={onOpenDashboard} className="text-[10px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-widest transition-colors">Gestão</button>
          )}
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-slate-900 font-black text-xs leading-none">{user.name}</div>
              <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">{user.role}</div>
            </div>
            
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl bg-indigo-100 overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform"
              title="Mudar foto de perfil"
            >
              {user.profilePicture ? (
                <img src={user.profilePicture} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-indigo-600">{user.name.charAt(0)}</span>
              )}
            </button>

            <button onClick={onLogout} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3-0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button onClick={toggleMenu} className="md:hidden flex items-center space-x-2">
           <button 
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="w-8 h-8 rounded-lg bg-indigo-100 overflow-hidden border border-white shadow-sm"
            >
              {user.profilePicture ? (
                <img src={user.profilePicture} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-black text-indigo-600">{user.name.charAt(0)}</span>
              )}
            </button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </nav>

      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-[200] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={toggleMenu}></div>
        <div className={`absolute top-0 right-0 h-full w-72 bg-white shadow-2xl transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-12">
              <div className="text-indigo-600 font-black tracking-tighter text-xl">MENU</div>
              <button onClick={toggleMenu} className="text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="flex-grow space-y-4">
              <button onClick={() => { onGoHome(); toggleMenu(); }} className="w-full text-left p-4 rounded-2xl bg-slate-50 font-black text-slate-800 text-xs uppercase tracking-widest flex items-center space-x-3">
                <span className="text-xl">📚</span> <span>Biblioteca</span>
              </button>
              {(user.role === 'teacher' || user.role === 'editor') && (
                <button onClick={() => { onOpenDashboard(); toggleMenu(); }} className="w-full text-left p-4 rounded-2xl bg-slate-50 font-black text-slate-800 text-xs uppercase tracking-widest flex items-center space-x-3">
                  <span className="text-xl">⚙️</span> <span>Gestão</span>
                </button>
              )}
            </div>

            <div className="mt-auto border-t pt-8 space-y-6">
              <div className="flex items-center space-x-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-xl overflow-hidden cursor-pointer"
                >
                  {user.profilePicture ? (
                    <img src={user.profilePicture} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div>
                  <div className="font-black text-slate-900 text-sm leading-none">{user.name}</div>
                  <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">{user.role}</div>
                </div>
              </div>
              <button onClick={onLogout} className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Sair da Conta</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
