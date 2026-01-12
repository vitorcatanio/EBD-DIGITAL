
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
import { mockMagazines } from './services/mockData';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([
    { id: 'editor-root', name: 'editor', password: 'edição', role: 'editor', isApproved: true },
    { id: 't-1', name: 'Prof. Marcos', password: '123', role: 'teacher', classId: 't1', isApproved: true },
    { id: 's-1', name: 'Ana Silva', password: '123', role: 'student', classId: 't1', isApproved: true }
  ]);
  const [classes, setClasses] = useState<Class[]>([
    { id: 't1', name: 'Turma Adultos' },
    { id: 't2', name: 'Turma Juvenis' },
    { id: 't3', name: 'Turma Infantil' }
  ]);
  const [magazines, setMagazines] = useState<Magazine[]>(mockMagazines);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  const [selectedMagId, setSelectedMagId] = useState<string | null>(null);
  const [view, setView] = useState<'library' | 'dashboard'>('library');

  // Sincroniza o currentUser com a lista de usuários caso haja atualizações (ex: foto de perfil)
  useEffect(() => {
    if (currentUser) {
      const updated = users.find(u => u.id === currentUser.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
      }
    }
  }, [users]);

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleMarkAnnouncementAsRead = (id: string) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      viewedAnnouncements: [...(currentUser.viewedAnnouncements || []), id]
    };
    handleUpdateUser(updatedUser);
  };

  const handleAddAnnouncement = (a: Announcement) => setAnnouncements(prev => [a, ...prev]);

  if (showIntro) return <Introduction onComplete={() => setShowIntro(false)} />;

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} onRegister={(u) => setUsers(prev => [...prev, u])} users={users} classes={classes} />;
  }

  const activeMag = magazines.find(m => m.id === selectedMagId);
  // Fix: Call getUnreadAnnouncement to get the actual unread announcement object for the current user
  const unreadAnnouncementValue = getUnreadAnnouncement(currentUser, announcements);

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Navbar 
        user={currentUser} 
        onLogout={() => { setCurrentUser(null); setSelectedMagId(null); setView('library'); }} 
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
              onUpdateMagazine={(updated) => setMagazines(prev => prev.map(m => m.id === updated.id ? updated : m))}
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
                onApproveStudent={(id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u))}
                onRejectStudent={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
                onUpdateUser={handleUpdateUser}
              />
            ) : currentUser.role === 'editor' ? (
              <EditorDashboard 
                classes={classes}
                onAddClass={(name) => setClasses(prev => [...prev, { id: `c-${Date.now()}`, name }])}
                onDeleteClass={(id) => setClasses(prev => prev.filter(c => c.id !== id))}
                onUpdateClass={(id, name) => setClasses(prev => prev.map(c => c.id === id ? { ...c, name } : c))}
                onAddMagazine={(m) => setMagazines(prev => [m, ...prev])}
                onUpdateMagazine={(updated) => setMagazines(prev => prev.map(m => m.id === updated.id ? updated : m))}
                magazines={magazines}
                onDeleteMagazine={(id) => setMagazines(prev => prev.filter(m => m.id !== id))}
                onSelectMagazine={(id) => { setSelectedMagId(id); setView('library'); }}
                pendingTeachers={users.filter(u => u.role === 'teacher' && !u.isApproved)}
                onApproveTeacher={(id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u))}
                onRejectTeacher={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
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

// Renamed and typed helper function to get the unread announcement
const getUnreadAnnouncement = (currentUser: User | null, announcements: Announcement[]): Announcement | null | undefined => {
  if (!currentUser || currentUser.role !== 'student') return null;
  return announcements.find(a => a.classId === currentUser.classId && !currentUser.viewedAnnouncements?.includes(a.id));
};

export default App;
