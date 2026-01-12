
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
import { collection, onSnapshot, query, where, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
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
  
  const [selectedMagId, setSelectedMagId] = useState<string | null>(null);
  const [view, setView] = useState<'library' | 'dashboard'>('library');

  // Monitorar estado de autenticação e dados do usuário logado
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        } else {
          // Fallback para o editor root definido no código antigo se necessário
          if (fbUser.email === 'editor@ebd.com') {
             setCurrentUser({ id: fbUser.uid, name: 'Editor Master', role: 'editor', isApproved: true });
          }
        }
      } else {
        setCurrentUser(null);
      }
    });

    // Sync Revistas em tempo real
    const unsubMags = onSnapshot(collection(db, 'magazines'), (snapshot) => {
      const mags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Magazine[];
      setMagazines(mags);
    });

    // Sync Turmas
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const cls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[];
      setClasses(cls);
    });

    // Sync Usuários (para dashboards de aprovação)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usrList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
      setUsers(usrList);
    });

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
    } catch (e) {
      console.error("Erro ao atualizar usuário no Firestore:", e);
    }
  };

  const handleMarkAnnouncementAsRead = (id: string) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      viewedAnnouncements: [...(currentUser.viewedAnnouncements || []), id]
    };
    handleUpdateUser(updatedUser);
  };

  const handleAddAnnouncement = async (a: Announcement) => {
    await setDoc(doc(db, 'announcements', a.id), a);
  };

  const unreadAnnouncementValue = getUnreadAnnouncement(currentUser, announcements);

  if (showIntro) return <Introduction onComplete={() => setShowIntro(false)} />;

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} onRegister={(u) => setUsers(prev => [...prev, u])} users={users} classes={classes} />;
  }

  const activeMag = magazines.find(m => m.id === selectedMagId);

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Navbar 
        user={currentUser} 
        onLogout={() => auth.signOut()} 
        onGoHome={() => { setSelectedMagId(null); setView('library'); }} 
        onOpenDashboard={() => { setSelectedMagId(null); setView('dashboard'); }}
        onUpdateUser={handleUpdateUser}
      />
      
      <main className="flex-grow relative overflow-hidden flex flex-col">
        {unreadAnnouncementValue && (
          <AnnouncementModal announcement={unreadAnnouncementValue} onRead={handleMarkAnnouncementAsRead} />
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
                onRejectStudent={(id) => { /* Implementar delete se desejar */ }}
                onUpdateUser={handleUpdateUser}
              />
            ) : currentUser.role === 'editor' ? (
              <EditorDashboard 
                classes={classes}
                onAddClass={async (name) => {
                  const id = `c-${Date.now()}`;
                  await setDoc(doc(db, 'classes', id), { id, name });
                }}
                onDeleteClass={(id) => {}}
                onUpdateClass={(id, name) => {}}
                onAddMagazine={async (m) => {
                  await setDoc(doc(db, 'magazines', m.id), m);
                }}
                onUpdateMagazine={async (updated) => {
                  await updateDoc(doc(db, 'magazines', updated.id), { ...updated });
                }}
                magazines={magazines}
                onDeleteMagazine={(id) => {}}
                onSelectMagazine={(id) => { setSelectedMagId(id); setView('library'); }}
                pendingTeachers={users.filter(u => u.role === 'teacher' && !u.isApproved)}
                onApproveTeacher={(id) => handleUpdateUser({ ...users.find(u => u.id === id)!, isApproved: true } as User)}
                onRejectTeacher={(id) => {}}
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

const getUnreadAnnouncement = (currentUser: User | null, announcements: Announcement[]): Announcement | null | undefined => {
  if (!currentUser || currentUser.role !== 'student') return null;
  return announcements.find(a => a.classId === currentUser.classId && !currentUser.viewedAnnouncements?.includes(a.id));
};

export default App;
