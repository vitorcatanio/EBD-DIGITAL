
import React, { useState } from 'react';
import { User, UserRole, Class } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
  users: User[];
  classes: Class[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, users, classes }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdminMode) {
      const editor = users.find(u => u.role === 'editor' && u.name.trim().toLowerCase() === name.trim().toLowerCase() && u.password === password);
      if (editor) {
        onLogin(editor);
        return;
      }
      if (name.trim().toLowerCase() === 'editor' && password === 'edição') {
        onLogin({ id: 'editor-root', name: 'editor', password: 'edição', role: 'editor', isApproved: true });
        return;
      }
      setError('Credenciais administrativas inválidas.');
      return;
    }

    const user = users.find(u => 
      u.name.trim().toLowerCase() === name.trim().toLowerCase() && 
      u.password === password &&
      (u.role === 'student' || u.role === 'teacher')
    );
    
    if (!user) {
      setError('Usuário ou senha incorretos.');
      return;
    }

    if (!user.isApproved) {
      setError('Aguardando aprovação da coordenação.');
      return;
    }

    onLogin(user);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!classId) {
      setError('Selecione sua turma.');
      return;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      password,
      role,
      classId,
      isApproved: false
    };

    onRegister(newUser);
    setSuccess(`Solicitação de ${role === 'teacher' ? 'Professor' : 'Aluno'} enviada!`);
    
    setTimeout(() => {
      setMode('login');
      setSuccess('');
      setName('');
      setPassword('');
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden select-none touch-none">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-[340px] bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-0.5">EBD DIGITAL</h1>
          <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em]">Escola Bíblica Online</p>
        </div>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-emerald-400 text-[10px] font-bold text-center animate-in slide-in-from-bottom-4 flex flex-col items-center">
             <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="uppercase tracking-widest">{success}</p>
          </div>
        ) : (
          <form onSubmit={mode === 'register' ? handleRegisterSubmit : handleLogin} className="space-y-4">
            
            {mode === 'register' && (
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button type="button" onClick={() => setRole('student')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${role === 'student' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Aluno</button>
                <button type="button" onClick={() => setRole('teacher')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${role === 'teacher' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Professor</button>
              </div>
            )}

            {isAdminMode && mode === 'login' && (
              <div className="bg-amber-500/10 border border-amber-500/20 py-2 rounded-lg text-center">
                <span className="text-amber-400 text-[8px] font-black uppercase tracking-widest">Acesso Administrativo</span>
              </div>
            )}

            <div className="space-y-3">
              <input 
                required type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder={isAdminMode ? "Login (editor)" : "Usuário"}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-bold text-xs"
              />

              <input 
                required type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-bold text-xs"
              />

              {(!isAdminMode || mode === 'register') && (
                <div className="relative">
                  <select 
                    required={mode === 'register'}
                    value={classId} onChange={e => setClassId(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none appearance-none font-bold text-xs"
                  >
                    <option value="" className="bg-slate-900 text-slate-500">Selecione sua Turma</option>
                    {classes.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-[8px] font-black text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20 uppercase tracking-widest">
                {error}
              </p>
            )}

            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all hover:bg-indigo-500 uppercase tracking-widest text-[10px]">
              {mode === 'register' ? 'Solicitar Cadastro' : 'Entrar'}
            </button>

            <div className="flex flex-col space-y-3 items-center pt-1">
              <button 
                type="button" 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setIsAdminMode(false); setError(''); }} 
                className="text-[8px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                {mode === 'login' ? 'Criar nova conta' : 'Voltar para login'}
              </button>
              
              {mode === 'login' && (
                <button 
                  type="button" 
                  onClick={() => { setIsAdminMode(!isAdminMode); setError(''); }} 
                  className={`px-3 py-1.5 rounded-full border text-[7px] font-black uppercase tracking-widest transition-all ${isAdminMode ? 'bg-amber-500 text-slate-950 border-amber-400' : 'border-white/10 text-slate-500'}`}
                >
                  {isAdminMode ? 'Sair do Modo Admin' : 'Sou Administrador'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;