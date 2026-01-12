import React, { useState, useEffect } from 'react';
import { User, Class, Magazine, Comment, Attendance, Announcement } from './types';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Library from './components/Library';
import MagazineReader from './components/MagazineReader';
import TeacherDashboard from './components/TeacherDashboard';
import EditorDashboard from './components/EditorDashboard';
import Introduction from './components/Introduction';
import AnnouncementModal from './components/AnnouncementModal';
import { db, auth } from './services/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, getDoc, deleteDoc, FirestoreError } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const [selectedMagId, setSelectedMagId] = useState<string | null>(null);
  const [view, setView] = useState<'library' | 'dashboard'>('library');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          } else if (fbUser.email === 'editor@ebd.com') {
            const editorUser: User = { id: fbUser.uid, name: 'Editor Master', role: 'editor', isApproved: true };
            await setDoc(doc(db, 'users', fbUser.uid), editorUser);
            setCurrentUser(editorUser);
          }
        } catch (err) {
          console.error("Erro ao buscar usuário:", err);
        }
      } else {
        setCurrentUser(null);
      }
    });

    const handleFirestoreError = (err: FirestoreError, context: string) => {
      console.error(`Erro em ${context}:`, err);
      if (err.code === 'permission-denied') {
        setPermissionError(`Acesso bloqueado ao banco (${context}). Verifique as 'Rules' no Console do Firebase.`);
      }
    };

    const unsubMags = onSnapshot(collection(db, 'magazines'), 
      (snapshot) => {
        const mags = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Magazine[];
        setMagazines(mags);
        setPermissionError(null);
      },
      (err) => handleFirestoreError(err as FirestoreError, "revistas")
    );

    const unsubClasses = onSnapshot(collection(db, 'classes'), 
      (snapshot) => {
        const cls = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Class[];
        setClasses(cls);
        setPermissionError(null);
      },
      (err) => handleFirestoreError(err as FirestoreError, "turmas")
    );

    const unsubUsers = onSnapshot(collection(db, 'users'), 
      (snapshot) => {
        const usrList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[];
        setUsers(usrList);
        setPermissionError(null);
      },
      (err) => handleFirestoreError(err as FirestoreError, "usuários")
    );

    return () => {
      unsubAuth();
      unsubMags();
      unsubClasses();
      unsubUsers();
    };
  }, []);

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await updateDoc(doc(db, 'users', updatedUser.id), { ...updatedUser });
    } catch (e: any) {
      console.error("Erro ao atualizar usuário:", e);
      if (e.code === 'permission-denied') alert("Erro de Permissão ao atualizar perfil.");
    }
  };

  const handleAddClass = async (name: string) => {
    try {
      const id = `c-${Date.now()}`;
      const newClass: Class = { id, name };
      await setDoc(doc(db, 'classes', id), newClass);
      alert("Turma '" + name + "' criada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar turma:", err);
      if (err.code === 'permission-denied') {
        alert("ERRO DE PERMISSÃO: O Firebase bloqueou a gravação. Altere as regras (Rules) para 'allow read, write: if true;'.");
      } else {
        alert("Erro ao salvar turma: " + err.message);
      }
    }
  };

  const handleAddMagazine = async (m: Magazine) => {
    try {
      await setDoc(doc(db, 'magazines', m.id), m);
    } catch (err) {
      console.error("Erro ao salvar revista:", err);
    }
  };

  const handleAddAnnouncement = async (a: Announcement) => {
    try {
      await setDoc(doc(db, 'announcements', a.id), a);
    } catch (err) {
      console.error("Erro ao salvar aviso:", err);
    }
  };

  if (showIntro) return <Introduction onComplete={() => setShowIntro(false)} />;

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} onRegister={(u) => handleUpdateUser(u)} users={users} classes={classes} />;
  }

  const activeMag = magazines.find(m => m.id === selectedMagId);

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {permissionError && (
        <div className="bg-red-600 text-white text-[10px] py-2 px-4 font-black uppercase tracking-widest text-center animate-pulse z-[1000] shadow-lg">
          ⚠️ ERRO DE CONFIGURAÇÃO: {permissionError}
        </div>
      )}
      
      <Navbar 
        user={currentUser} 
        onLogout={() => auth.signOut()} 
        onGoHome={() => { setSelectedMagId(null); setView('library'); }} 
        onOpenDashboard={() => { setSelectedMagId(null); setView('dashboard'); }}
        onUpdateUser={handleUpdateUser}
      />
      
      <main className="flex-grow relative overflow-hidden flex flex-col">
        {currentUser.role === 'student' && announcements.find(a => a.classId === currentUser.classId && !currentUser.viewedAnnouncements?.includes(a.id)) && (
          <AnnouncementModal 
            announcement={announcements.find(a => a.classId === currentUser.classId && !currentUser.viewedAnnouncements?.includes(a.id))!} 
            onRead={(id) => {
              const updatedUser = {
                ...currentUser,
                viewedAnnouncements: [...(currentUser.viewedAnnouncements || []), id]
              };
              handleUpdateUser(updatedUser);
            }} 
          />
        )}

        <div className="flex-grow overflow-y-auto no-scrollbar">
          {selectedMagId && activeMag ? (
            <MagazineReader 
              magazine={activeMag} 
              user={currentUser}
              comments={comments.filter(c => c.magazineId === activeMag.id)}
              onAddComment={(c) => setComments(prev => [c, ...prev])}
              onDeleteComment={(id) => setComments(prev => prev.filter(c => c.id !== id))}
              onClose={() => setSelectedMagId(null)}
              onUpdateMagazine={async (updated) => {
                await updateDoc(doc(db, 'magazines', updated.id), { ...updated });
              }}
            />
          ) : view === 'dashboard' ? (
            currentUser.role === 'teacher' ? (
              <TeacherDashboard 
                user={currentUser} 
                students={users.filter(u => u.role === 'student' && u.classId === currentUser.classId)}
                classes={classes}
                attendances={attendances}
                announcements={announcements.filter(a => a.classId === currentUser.classId)}
                onAddAnnouncement={handleAddAnnouncement}
                onToggleAttendance={(studentId, studentName, classId, isPresent) => {
                  const today = new Date().toISOString().split('T')[0];
                  setAttendances(prev => [...prev.filter(a => !(a.userId === studentId && a.date === today)), { id: `att-${Date.now()}`, classId, userId: studentId, userName: studentName, date: today, isPresent }]);
                }}
                onApproveStudent={(id) => handleUpdateUser({ ...users.find(u => u.id === id)!, isApproved: true } as User)}
                onRejectStudent={(id) => deleteDoc(doc(db, 'users', id))}
                onUpdateUser={handleUpdateUser}
              />
            ) : currentUser.role === 'editor' ? (
              <EditorDashboard 
                classes={classes}
                onAddClass={handleAddClass}
                onDeleteClass={(id) => deleteDoc(doc(db, 'classes', id))}
                onUpdateClass={(id, name) => updateDoc(doc(db, 'classes', id), { name })}
                onAddMagazine={handleAddMagazine}
                onUpdateMagazine={async (updated) => {
                  await updateDoc(doc(db, 'magazines', updated.id), { ...updated });
                }}
                magazines={magazines}
                onDeleteMagazine={(id) => deleteDoc(doc(db, 'magazines', id))}
                onSelectMagazine={(id) => { setSelectedMagId(id); setView('library'); }}
                pendingTeachers={users.filter(u => u.role === 'teacher' && !u.isApproved)}
                onApproveTeacher={(id) => handleUpdateUser({ ...users.find(u => u.id === id)!, isApproved: true } as User)}
                onRejectTeacher={(id) => deleteDoc(doc(db, 'users', id))}
                attendances={attendances}
                onUpdateUser={handleUpdateUser}
                teachers={users.filter(u => u.role === 'teacher' && u.isApproved)}
              />
            ) : null
          ) : (
            <Library magazines={magazines.filter(m => currentUser.role === 'editor' || m.classId === currentUser.classId)} onSelect={setSelectedMagId} user={currentUser} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;