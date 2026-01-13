
import React, { useState, useEffect } from 'react';
import { User, Class, Magazine, Comment, Attendance, Announcement, UserResponse } from './types';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Library from './components/Library';
import MagazineReader from './components/MagazineReader';
import TeacherDashboard from './components/TeacherDashboard';
import EditorDashboard from './components/EditorDashboard';
import Introduction from './components/Introduction';
import AnnouncementModal from './components/AnnouncementModal';
import { db, auth } from './services/firebase';
import { collection, onSnapshot, doc, setDoc, getDoc, deleteDoc, FirestoreError, query, where } from 'firebase/firestore';
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
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
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
        setPermissionError(`Acesso bloqueado (${context}). Verifique as regras do Firebase.`);
      }
    };

    const unsubMags = onSnapshot(collection(db, 'magazines'), (snapshot) => {
      setMagazines(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Magazine[]);
    });

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Class[]);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[]);
    });

    const unsubResponses = onSnapshot(collection(db, 'responses'), (snapshot) => {
      setUserResponses(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as UserResponse[]);
    });

    // Added Firestore listener for announcements
    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Announcement[]);
    });

    // Added Firestore listener for attendances
    const unsubAttendances = onSnapshot(collection(db, 'attendances'), (snapshot) => {
      setAttendances(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Attendance[]);
    });

    return () => {
      unsubAuth();
      unsubMags();
      unsubClasses();
      unsubUsers();
      unsubResponses();
      unsubAnnouncements();
      unsubAttendances();
    };
  }, []);

  const handleUpdateUser = async (updatedUser: User) => {
    await setDoc(doc(db, 'users', updatedUser.id), updatedUser, { merge: true });
  };

  const handleSaveResponse = async (resp: UserResponse) => {
    await setDoc(doc(db, 'responses', resp.id), resp);
  };

  // Fix: Added handleAddAnnouncement to handle announcement creation
  const handleAddAnnouncement = async (ann: Announcement) => {
    await setDoc(doc(db, 'announcements', ann.id), ann);
  };

  // Fix: Added handleToggleAttendance to handle attendance recording
  const handleToggleAttendance = async (studentId: string, studentName: string, classId: string, isPresent: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    const id = `att-${classId}-${studentId}-${today}`;
    const attendance: Attendance = {
      id,
      classId,
      userId: studentId,
      userName: studentName,
      date: today,
      isPresent
    };
    await setDoc(doc(db, 'attendances', id), attendance);
  };

  if (showIntro) return <Introduction onComplete={() => setShowIntro(false)} />;
  if (!currentUser) return <Login onLogin={setCurrentUser} onRegister={handleUpdateUser} users={users} classes={classes} />;

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
        <div className={`flex-grow ${selectedMagId ? 'h-full flex flex-col' : 'overflow-y-auto no-scrollbar'}`}>
          {selectedMagId && activeMag ? (
            <MagazineReader 
              magazine={activeMag} 
              user={currentUser}
              comments={comments.filter(c => c.magazineId === activeMag.id)}
              userResponses={userResponses.filter(r => r.magazineId === activeMag.id)}
              onAddComment={(c) => setComments(prev => [c, ...prev])}
              onSaveResponse={handleSaveResponse}
              onClose={() => setSelectedMagId(null)}
              onUpdateMagazine={async (updated) => {
                await setDoc(doc(db, 'magazines', updated.id), { ...updated }, { merge: true });
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
                responses={userResponses}
                magazines={magazines.filter(m => m.classId === currentUser.classId)}
                onAddAnnouncement={handleAddAnnouncement}
                onToggleAttendance={handleToggleAttendance}
                onApproveStudent={(id) => handleUpdateUser({ ...users.find(u => u.id === id)!, isApproved: true } as User)}
                onRejectStudent={(id) => deleteDoc(doc(db, 'users', id))}
                onUpdateUser={handleUpdateUser}
              />
            ) : (
              /* Fix: Provided full implementation for EditorDashboard props */
              <EditorDashboard 
                classes={classes}
                onAddClass={async (name) => {
                  const id = `class-${Date.now()}`;
                  await setDoc(doc(db, 'classes', id), { id, name });
                }}
                onDeleteClass={async (id) => await deleteDoc(doc(db, 'classes', id))}
                onUpdateClass={async (id, name) => await setDoc(doc(db, 'classes', id), { name }, { merge: true })}
                magazines={magazines}
                onAddMagazine={async (m) => await setDoc(doc(db, 'magazines', m.id), m)}
                onUpdateMagazine={async (m) => await setDoc(doc(db, 'magazines', m.id), m, { merge: true })}
                onDeleteMagazine={async (id) => await deleteDoc(doc(db, 'magazines', id))}
                onSelectMagazine={(id) => { setSelectedMagId(id); setView('library'); }}
                pendingTeachers={users.filter(u => u.role === 'teacher' && !u.isApproved)}
                onApproveTeacher={(id) => handleUpdateUser({ ...users.find(u => u.id === id)!, isApproved: true } as User)}
                onRejectTeacher={(id) => deleteDoc(doc(db, 'users', id))}
                attendances={attendances}
                onUpdateUser={handleUpdateUser}
                teachers={users.filter(u => u.role === 'teacher')}
              />
            ) 
          ) : (
            <Library magazines={magazines.filter(m => currentUser.role === 'editor' || m.classId === currentUser.classId)} onSelect={setSelectedMagId} user={currentUser} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
