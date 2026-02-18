import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  CreditCard, 
  Calendar, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  ArrowUpCircle, 
  UserX, 
  ShieldCheck,
  Award,
  LayoutDashboard,
  TrendingUp,
  UserCheck,
  Activity,
  ChevronRight,
  ClipboardList,
  Clock,
  Layout,
  Bell,
  AlertCircle,
  Send,
  History,
  Menu,
  X as CloseIcon
} from 'lucide-react';
import { Student, StudentStatus, Schedule, SyllabusTopic, AuditLogEntry } from './types';
import { ADMIN_PASSWORD, CLASSES, MONTHS, CURRENT_YEAR } from './constants';
import StudentForm from './components/StudentForm';
import StudentProfile from './components/StudentProfile';
import ClassroomManagement from './components/ClassroomManagement';
import FeesManager from './components/FeesManager';
import DeactivatedAccounts from './components/DeactivatedAccounts';
import SecurityModal from './components/SecurityModal';
import DailySchedule from './components/DailySchedule';
import StudentAvatar from './components/StudentAvatar';

const STORAGE_KEY = 'BRIGHTXLEARN_DATA_V3';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'classroom' | 'fees' | 'deactivated' | 'schedule'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [syllabusTopics, setSyllabusTopics] = useState<SyllabusTopic[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [securityModal, setSecurityModal] = useState<{ isOpen: boolean; action: () => void } | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setStudents(parsed.students || []);
      setSchedules(parsed.schedules || []);
      setSyllabusTopics(parsed.syllabusTopics || []);
      setAuditLogs(parsed.auditLogs || []);
    }
  }, []);

  const saveToStorage = useCallback((st: Student[], sch: Schedule[], syl: SyllabusTopic[], logs: AuditLogEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ students: st, schedules: sch, syllabusTopics: syl, auditLogs: logs }));
  }, []);

  const addAuditLog = useCallback((event: string) => {
    const newEntry: AuditLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      event,
      timestamp: new Date().toLocaleString()
    };
    setAuditLogs(prev => {
      const updated = [newEntry, ...prev].slice(0, 200);
      saveToStorage(students, schedules, syllabusTopics, updated);
      return updated;
    });
  }, [students, schedules, syllabusTopics, saveToStorage]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      addAuditLog("Admin Logged In successfully");
    } else {
      alert("Invalid Admin Password!");
    }
  };

  const addOrUpdateStudent = (data: any) => {
    let updatedStudents: Student[];
    if (editingStudent) {
      updatedStudents = students.map(s => s.id === editingStudent.id ? { ...s, ...data } : s);
      addAuditLog(`Updated profile for Student: ${data.name}`);
    } else {
      const newStudent: Student = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        status: StudentStatus.ACTIVE,
        paidMonths: [],
        attendance: [],
        absences: [],
        examMarks: [],
        syllabusProgress: 0,
        badges: []
      };
      updatedStudents = [...students, newStudent];
      addAuditLog(`New Admission: ${data.name}`);
    }
    setStudents(updatedStudents);
    saveToStorage(updatedStudents, schedules, syllabusTopics, auditLogs);
    setIsFormOpen(false);
    setEditingStudent(undefined);
  };

  const requestSecurityAction = (action: () => void) => {
    setSecurityModal({ isOpen: true, action });
  };

  const deleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    requestSecurityAction(() => {
      addAuditLog(`Security Authorized: Permanent Delete Student - ${student?.name}`);
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      saveToStorage(updated, schedules, syllabusTopics, auditLogs);
      setSelectedStudentId(null);
    });
  };

  const toggleFeeStatus = (studentId: string, month: string) => {
    const student = students.find(s => s.id === studentId);
    if (student?.paidMonths.includes(month)) {
      requestSecurityAction(() => {
        addAuditLog(`Security Authorized: Unchecked fee for ${student?.name} (${month})`);
        const updated = students.map(s => s.id === studentId ? { ...s, paidMonths: s.paidMonths.filter(m => m !== month) } : s);
        setStudents(updated);
        saveToStorage(updated, schedules, syllabusTopics, auditLogs);
      });
    } else {
      addAuditLog(`Fee Paid: ${student?.name} for ${month}`);
      const updated = students.map(s => s.id === studentId ? { ...s, paidMonths: [...s.paidMonths, month] } : s);
      setStudents(updated);
      saveToStorage(updated, schedules, syllabusTopics, auditLogs);
    }
  };

  const promoteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    const currentIdx = CLASSES.indexOf(student.studentClass);
    if (currentIdx < CLASSES.length - 1) {
      const nextClass = CLASSES[currentIdx + 1];
      addAuditLog(`Student Promoted: ${student.name} from ${student.studentClass} to ${nextClass}`);
      const updated = students.map(s => s.id === id ? { ...s, studentClass: nextClass } : s);
      setStudents(updated);
      saveToStorage(updated, schedules, syllabusTopics, auditLogs);
      setCelebration(student.name);
      setTimeout(() => setCelebration(null), 3000);
    } else {
      alert("Student is already in the highest class!");
    }
  };

  const toggleDeactivation = (id: string) => {
    const student = students.find(s => s.id === id);
    const newStatus = student?.status === StudentStatus.ACTIVE ? StudentStatus.DEACTIVATED : StudentStatus.ACTIVE;
    addAuditLog(`Account ${newStatus === StudentStatus.ACTIVE ? 'Reactivated' : 'Archived'}: ${student?.name}`);
    const updated = students.map(s => s.id === id ? { ...s, status: newStatus } : s);
    setStudents(updated);
    saveToStorage(updated, schedules, syllabusTopics, auditLogs);
  };

  const updateAttendance = (date: string, presentIds: string[], absentIds: string[], targetClass: string) => {
    const updated = students.map(s => {
      if (s.studentClass !== targetClass) return s;
      
      const isPresent = presentIds.includes(s.id);
      const isAbsent = absentIds.includes(s.id);

      let newAttendance = [...(s.attendance || [])];
      let newAbsences = [...(s.absences || [])];

      if (isPresent) {
        if (!newAttendance.includes(date)) newAttendance.push(date);
        newAbsences = newAbsences.filter(d => d !== date);
      } else if (isAbsent) {
        if (!newAbsences.includes(date)) newAbsences.push(date);
        newAttendance = newAttendance.filter(d => d !== date);
      } else {
        newAttendance = newAttendance.filter(d => d !== date);
        newAbsences = newAbsences.filter(d => d !== date);
      }

      return { ...s, attendance: newAttendance, absences: newAbsences };
    });
    addAuditLog(`Attendance recorded for ${targetClass} on ${date}`);
    setStudents(updated);
    saveToStorage(updated, schedules, syllabusTopics, auditLogs);
  };

  const updateBulkMarks = (targetClass: string, subject: string, marksData: { studentId: string, marks: number, total: number }[]) => {
    const sortedPerformers = [...marksData].sort((a, b) => (b.marks / b.total) - (a.marks / a.total));
    const top3Ids = sortedPerformers.slice(0, 3).map(m => m.studentId);

    const updated = students.map(s => {
      if (s.studentClass !== targetClass) return s;
      
      const markEntry = marksData.find(m => m.studentId === s.id);
      const filteredMarks = s.examMarks.filter(m => m.subject !== subject);
      
      let updatedMarks = s.examMarks;
      let updatedBadges = s.badges || [];

      if (markEntry) {
        updatedMarks = [...filteredMarks, { subject, marks: markEntry.marks, total: markEntry.total }];
        if (top3Ids.includes(s.id)) {
           if (!updatedBadges.includes('Star Student')) {
             updatedBadges = [...updatedBadges, 'Star Student'];
           }
        } else {
           updatedBadges = updatedBadges.filter(b => b !== 'Star Student');
        }
      }

      return { 
        ...s, 
        examMarks: updatedMarks,
        badges: updatedBadges
      };
    });

    addAuditLog(`Exam results updated for ${targetClass} - ${subject}`);
    setStudents(updated);
    saveToStorage(updated, schedules, syllabusTopics, auditLogs);
  };

  const addSchedule = (sch: Omit<Schedule, 'id' | 'completed'>) => {
    const newSch: Schedule = { ...sch, id: Math.random().toString(36).substr(2, 9), completed: false };
    const updated = [...schedules, newSch];
    setSchedules(updated);
    saveToStorage(students, updated, syllabusTopics, auditLogs);
  };

  const deleteSchedule = (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated);
    saveToStorage(students, updated, syllabusTopics, auditLogs);
  };

  const toggleSchedule = (id: string) => {
    const updated = schedules.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    setSchedules(updated);
    saveToStorage(students, updated, syllabusTopics, auditLogs);
  };

  const addSyllabusTopic = (title: string, targetClass: string) => {
    const newTopic: SyllabusTopic = { id: Math.random().toString(36).substr(2, 9), title, targetClass, completed: false };
    const updated = [...syllabusTopics, newTopic];
    setSyllabusTopics(updated);
    saveToStorage(students, schedules, updated, auditLogs);
  };

  const toggleSyllabusTopic = (id: string) => {
    const updated = syllabusTopics.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setSyllabusTopics(updated);
    
    const affectedClass = syllabusTopics.find(t => t.id === id)?.targetClass;
    if (affectedClass) {
      const classTopics = updated.filter(t => t.targetClass === affectedClass);
      const completedCount = classTopics.filter(t => t.completed).length;
      const progress = classTopics.length > 0 ? Math.round((completedCount / classTopics.length) * 100) : 0;
      
      const updatedStudents = students.map(s => s.studentClass === affectedClass ? { ...s, syllabusProgress: progress } : s);
      setStudents(updatedStudents);
      saveToStorage(updatedStudents, schedules, updated, auditLogs);
    } else {
      saveToStorage(students, schedules, updated, auditLogs);
    }
  };

  const deleteSyllabusTopic = (id: string) => {
    const updated = syllabusTopics.filter(t => t.id !== id);
    setSyllabusTopics(updated);
    saveToStorage(students, schedules, updated, auditLogs);
  };

  const activeStudents = useMemo(() => students.filter(s => s.status === StudentStatus.ACTIVE), [students]);
  const deactivatedStudents = useMemo(() => students.filter(s => s.status === StudentStatus.DEACTIVATED), [students]);
  const filteredStudents = useMemo(() => activeStudents.filter(s => (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentPhone.includes(searchTerm)) && (classFilter === 'All' || s.studentClass === classFilter)), [activeStudents, searchTerm, classFilter]);

  const dashboardStats = useMemo(() => {
    const currentMonthId = `${CURRENT_YEAR}-${new Date().getMonth() + 1}`;
    const paidThisMonth = activeStudents.filter(s => s.paidMonths.includes(currentMonthId)).length;
    const attendanceToday = activeStudents.filter(s => s.attendance.includes(new Date().toISOString().split('T')[0])).length;
    
    const todayDate = new Date().getDate();
    const unpaidStudents = activeStudents.filter(s => !s.paidMonths.includes(currentMonthId));
    const showReminders = todayDate >= 12 && unpaidStudents.length > 0;

    return {
      total: activeStudents.length,
      deactivated: deactivatedStudents.length,
      paid: paidThisMonth,
      attendance: attendanceToday,
      showReminders,
      unpaidStudents,
      currentMonthName: MONTHS[new Date().getMonth()]
    };
  }, [activeStudents, deactivatedStudents]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brightx-navy px-4">
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <h1 className="text-3xl md:text-4xl logo-font text-brightx-navy mb-2">BrightX<span className="teal-box">LEARN</span></h1>
            <p className="text-gray-400 font-semibold tracking-widest uppercase text-[10px] md:text-xs">Admin Management Portal</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Security Key</label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-100 focus:border-brightx-teal outline-none transition-all text-lg font-mono"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-brightx-navy hover:bg-black text-white font-black py-4 rounded-xl transition-all shadow-xl active:scale-95"
            >
              Access Dashboard
            </button>
          </form>
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Authorized Access Only</span>
          </div>
        </div>
      </div>
    );
  }

  const Logo = () => (
    <div className="flex items-center gap-0 select-none scale-75 origin-left">
      <span className="text-3xl font-black text-brightx-navy tracking-tighter">Bright</span>
      <span className="text-4xl font-black text-brightx-navy tracking-tighter -ml-0.5 mr-[-0.2em] relative z-10">X</span>
      <div className="bg-brightx-teal text-white px-4 py-2 flex items-center justify-center translate-y-1">
        <span className="text-xl font-black tracking-[0.2em] ml-2">LEARN</span>
      </div>
    </div>
  );

  const NavItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Control Center' },
    { id: 'directory', icon: Users, label: 'Students' },
    { id: 'classroom', icon: Layout, label: 'Classroom' },
    { id: 'fees', icon: CreditCard, label: 'Accounts' },
    { id: 'schedule', icon: Clock, label: 'Daily Schedule' },
    { id: 'deactivated', icon: History, label: 'Archives' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:sticky top-0 h-screen w-72 bg-white border-r border-gray-200 z-50 transition-transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-8 flex items-center justify-between">
          <Logo />
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {NavItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-brightx-navy text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-brightx-teal' : 'group-hover:text-brightx-navy'}`} /> 
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-gray-100">
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" /> Logout Session
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-30">
          <Logo />
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-brightx-navy bg-gray-50 rounded-xl"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-10 overflow-auto">
          {celebration && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 pointer-events-none animate-in fade-in zoom-in duration-500">
              <div className="text-center px-4">
                <Award className="w-24 md:w-32 h-24 md:h-32 text-yellow-400 mx-auto animate-bounce" />
                <h2 className="text-3xl md:text-5xl font-black text-brightx-navy mt-4">UPGRADED!</h2>
                <p className="text-lg md:text-2xl font-bold text-brightx-teal mt-2">{celebration} promoted successfully</p>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <section className="space-y-6 md:space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-brightx-navy leading-tight">Welcome Back,<br/>Admin.</h1>
                  <p className="text-gray-400 font-medium mt-2">Here is what's happening today.</p>
                </div>
                <div className="md:text-right">
                  <span className="text-[10px] md:text-xs font-black text-brightx-teal uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'Enrolled Students', value: dashboardStats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
                  { label: 'Today Attendance', value: dashboardStats.attendance, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
                  { label: 'Fees Paid (Month)', value: dashboardStats.paid, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100' },
                  { label: 'Archived Accounts', value: dashboardStats.deactivated, icon: UserX, color: 'text-red-600', bg: 'bg-red-100' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <p className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl md:text-3xl font-black text-gray-800">{stat.value}</p>
                  </div>
                ))}
              </div>

              {dashboardStats.showReminders && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-orange-500 p-3 rounded-2xl text-white">
                      <Bell className="w-5 h-5 md:w-6 md:h-6 animate-ring" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-orange-900">Fee Payment Reminders</h3>
                      <p className="text-orange-700 font-medium text-xs md:text-sm">Today is past the 12th. {dashboardStats.unpaidStudents.length} students pending for {dashboardStats.currentMonthName}.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {dashboardStats.unpaidStudents.slice(0, 6).map(s => (
                      <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <StudentAvatar 
                            iconId={s.profileIcon} 
                            name={s.name} 
                            className="w-8 h-8 flex-shrink-0 bg-orange-100 text-orange-600" 
                            size={16} 
                          />
                          <div className="truncate">
                            <p className="text-sm font-bold text-gray-800 truncate">{s.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.studentClass}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveTab('fees')}
                          className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all flex-shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {dashboardStats.unpaidStudents.length > 6 && (
                      <button 
                        onClick={() => setActiveTab('fees')}
                        className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 p-4 rounded-2xl border border-dashed border-orange-300 font-black text-sm transition-all"
                      >
                        + View {dashboardStats.unpaidStudents.length - 6} more
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-brightx-navy rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                  <TrendingUp className="absolute -bottom-10 -right-10 w-32 md:w-48 h-32 md:h-48 opacity-10" />
                  <h3 className="text-lg md:text-xl font-black mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 relative z-10">
                    <button onClick={() => { setEditingStudent(undefined); setIsFormOpen(true); }} className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all font-bold text-sm md:text-base">
                      New Admission <Plus className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveTab('classroom')} className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all font-bold text-sm md:text-base">
                      Classroom <Layout className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveTab('fees')} className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all font-bold text-sm md:text-base">
                      Collect Fees <CreditCard className="w-5 h-5" />
                    </button>
                  </div>
              </div>
            </section>
          )}

          {activeTab === 'directory' && (
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-brightx-navy">Student Directory</h1>
                  <p className="text-gray-400 font-medium">{activeStudents.length} Active Records</p>
                </div>
                <button 
                  onClick={() => { setEditingStudent(undefined); setIsFormOpen(true); }}
                  className="bg-brightx-teal hover:bg-brightx-navy text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" /> <span className="hidden sm:inline">NEW ADMISSION</span><span className="sm:hidden">ADD</span>
                </button>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search by name or phone..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-3 border-2 border-transparent bg-gray-50 rounded-2xl outline-none focus:border-brightx-teal transition-all text-sm"
                  />
                </div>
                <select 
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-6 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-brightx-teal font-bold text-gray-700 appearance-none min-w-[150px] text-sm"
                >
                  <option value="All">All Classes</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredStudents.map(student => (
                  <div 
                    key={student.id} 
                    className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer relative group overflow-hidden"
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-brightx-teal/5 rounded-bl-full -mr-8 md:-mr-10 -mt-8 md:-mt-10 group-hover:bg-brightx-teal/10 transition-colors" />
                    <div className="flex justify-between items-start mb-6">
                      <StudentAvatar 
                        iconId={student.profileIcon} 
                        name={student.name} 
                        className="w-12 md:w-16 h-12 md:h-16 bg-brightx-navy text-brightx-teal shadow-lg rotate-3 group-hover:rotate-0" 
                        size={student.profileIcon ? 24 : 32}
                      />
                      <span className="px-3 py-1 bg-brightx-teal/10 text-brightx-teal text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest">
                        {student.studentClass}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-gray-800 mb-1 group-hover:text-brightx-teal transition-colors truncate">{student.name}</h3>
                    <p className="text-xs md:text-sm text-gray-400 font-bold mb-6">{student.studentPhone}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'classroom' && (
            <ClassroomManagement 
              students={activeStudents} 
              onSaveAttendance={updateAttendance} 
              onSaveMarks={updateBulkMarks} 
              syllabusTopics={syllabusTopics}
              onAddSyllabusTopic={addSyllabusTopic}
              onToggleSyllabusTopic={toggleSyllabusTopic}
              onDeleteSyllabusTopic={deleteSyllabusTopic}
            />
          )}
          {activeTab === 'fees' && <FeesManager students={activeStudents} onToggleFee={toggleFeeStatus} />}
          {activeTab === 'schedule' && <DailySchedule schedules={schedules} onAdd={addSchedule} onDelete={deleteSchedule} onToggle={toggleSchedule} />}
          {activeTab === 'deactivated' && <DeactivatedAccounts students={deactivatedStudents} auditLogs={auditLogs} onReactivate={toggleDeactivation} />}
        </div>
      </main>

      {isFormOpen && <StudentForm onClose={() => setIsFormOpen(false)} onSubmit={addOrUpdateStudent} initialData={editingStudent} />}
      {selectedStudentId && (
        <StudentProfile 
          student={students.find(s => s.id === selectedStudentId)!}
          onClose={() => setSelectedStudentId(null)}
          onDelete={() => deleteStudent(selectedStudentId)}
          onEdit={() => { setEditingStudent(students.find(s => s.id === selectedStudentId)); setIsFormOpen(true); setSelectedStudentId(null); }}
          onPromote={() => promoteStudent(selectedStudentId)}
          onDeactivate={() => { toggleDeactivation(selectedStudentId); setSelectedStudentId(null); }}
        />
      )}
      {securityModal && <SecurityModal isOpen={securityModal.isOpen} onConfirm={() => { securityModal.action(); setSecurityModal(null); }} onClose={() => setSecurityModal(null)} />}
    </div>
  );
};

export default App;