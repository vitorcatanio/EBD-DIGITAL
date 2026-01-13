
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
        } catch (err) { console.error(err); }
      } else { setCurrentUser(null); }
    });

    onSnapshot(collection(db, 'magazines'), s => setMagazines(s.docs.map(d => ({ ...d.data(), id: d.id })) as Magazine[]));
    onSnapshot(collection(db, 'classes'), s => setClasses(s.docs.map(d => ({ ...d.data(), id: d.id })) as Class[]));
    onSnapshot(collection(db, 'users'), s => setUsers(s.docs.map(d => ({ ...d.data(), id: d.id })) as User[]));
    onSnapshot(collection(db, 'responses'), s => setUserResponses(s.docs.map(d => ({ ...d.data(), id: d.id })) as UserResponse[]));
    onSnapshot(collection(db, 'announcements'), s => setAnnouncements(s.docs.map(d => ({ ...d.data(), id: d.id })) as Announcement[]));
    onSnapshot(collection(db, 'attendances'), s => setAttendances(s.docs.map(d => ({ ...d.data(), id: d.id })) as Attendance[]));

    return () => unsubAuth();
  }, []);

  const handleUpdateMagazine = async (m: Magazine) => await setDoc(doc(db, 'magazines', m.id), m);
  const handleUpdateUser = async (u: User) => await setDoc(doc(db, 'users', u.id), u, { merge: true });

  // Chamada de Presença Persistente
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
      <Navbar user={currentUser} onLogout={() => auth.signOut()} onGoHome={() => { setSelectedMagId(null); setView('library'); }} onOpenDashboard={() => { setSelectedMagId(null); setView('dashboard'); }} onUpdateUser={handleUpdateUser} />
      
      <main className="flex-grow relative overflow-hidden flex flex-col">
        <div className={`flex-grow ${selectedMagId ? 'h-full flex flex-col' : 'overflow-y-auto no-scrollbar'}`}>
          {selectedMagId && activeMag ? (
            <MagazineReader 
              magazine={activeMag} 
              user={currentUser}
              comments={comments.filter(c => c.magazineId === activeMag.id)}
              userResponses={userResponses.filter(r => r.magazineId === activeMag.id)}
              onAddComment={(c) => setComments(prev => [c, ...prev])}
              onSaveResponse={async (r) => await setDoc(doc(db, 'responses', r.id), r)}
              onClose={() => setSelectedMagId(null)}
              onUpdateMagazine={handleUpdateMagazine}
            />
          ) : view === 'dashboard' ? (
            currentUser.role === 'teacher' ? (
              <TeacherDashboard 
                user={currentUser} 
                students={users.filter(u => u.role === 'student' && u.classId === currentUser.classId)}
                classes={classes} attendances={attendances} responses={userResponses} magazines={magazines.filter(m => m.classId === currentUser.classId)}
                announcements={announcements.filter(a => a.classId === currentUser.classId)}
                onAddAnnouncement={async (a) => await setDoc(doc(db, 'announcements', a.id), a)}
                onToggleAttendance={handleToggleAttendance}
                onApproveStudent={id => handleUpdateUser({ ...users.find(u => u.id === id)!, isApproved: true } as User)}
                onRejectStudent={id => deleteDoc(doc(db, 'users', id))}
                onUpdateUser={handleUpdateUser}
                onUpdateMagazine={handleUpdateMagazine}
              />
            ) : (
              <EditorDashboard 
                classes={classes}
                onAddClass={async n => { const id = `c-${Date.now()}`; await setDoc(doc(db, 'classes', id), { id, name: n }); }}
                onDeleteClass={id => deleteDoc(doc(db, 'classes', id))}
                onUpdateClass={(id, n) => setDoc(doc(db, 'classes', id), { name: n }, { merge: true })}
                magazines={magazines}
                onAddMagazine={handleUpdateMagazine}
                onUpdateMagazine={handleUpdateMagazine}
                onDeleteMagazine={id => deleteDoc(doc(db, 'magazines', id))}
                onSelectMagazine={setSelectedMagId}
                pendingTeachers={users.filter(u => u.role === 'teacher' && !u.isApproved)}
                onApproveTeacher={id => handleUpdateUser({ ...users.find(u => u.id === id)!, isApproved: true } as User)}
                onRejectTeacher={id => deleteDoc(doc(db, 'users', id))}
                attendances={attendances}
                onUpdateUser={handleUpdateUser}
                teachers={users.filter(u => u.role === 'teacher')}
              />
            ) 
          ) : (
            <Library 
              magazines={magazines.filter(m => currentUser.role === 'editor' || m.classId === currentUser.classId)} 
              onSelect={setSelectedMagId} 
              user={currentUser}
              attendances={attendances}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
