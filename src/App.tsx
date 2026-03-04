/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  School, 
  Building2, 
  FileText, 
  GraduationCap, 
  LogOut, 
  User as UserIcon,
  ChevronRight,
  Search,
  Download,
  Plus,
  BarChart3,
  CheckCircle2,
  Clock,
  Award
} from 'lucide-react';
import logo from './assets/onslogo.png';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Role = 'admin' | 'vendor' | 'trainer' | 'college' | 'student';

interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  college_id?: number;
  gender?: string;
  dob?: string;
  phone?: string;
  department?: string;
  batch?: string;
  cgpa?: number;
  tenth_percent?: number;
  twelfth_percent?: number;
  address?: string;
  placement_status?: string;
  package?: number;
  attendance?: number;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
    )}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      <span className="text-2xl font-bold text-slate-800">{value}</span>
    </div>
    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</p>
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [stats, setStats] = useState<any>({ vendors: 0, colleges: 0, trainers: 0, students: 0, studentPerformance: [], placementStats: {} });
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportType, setReportType] = useState('placement');
  const [courses, setCourses] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab, reportType, selectedCourse]);

  const REPORT_TYPES = [
    { id: 'student-profile', label: 'Student Profile' },
    { id: 'enrollment', label: 'Enrollment' },
    { id: 'course-progress', label: 'Course Progress' },
    { id: 'material-access', label: 'Material Access' },
    { id: 'video-watch-time', label: 'Video Watch Time' },
    { id: 'assignment-submission', label: 'Assignment Submission' },
    { id: 'assessment-attempt', label: 'Assessment Attempt' },
    { id: 'assessment-score', label: 'Assessment Score' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'aptitude-test', label: 'Aptitude Test' },
    { id: 'technical-skill', label: 'Technical Skill' },
    { id: 'placement-readiness', label: 'Placement Readiness' },
    { id: 'placement-status', label: 'Placement Status' },
    { id: 'offer-letter', label: 'Offer Letter' },
    { id: 'leaderboard', label: 'Leaderboard' },
  ];

  const fetchData = async () => {
    try {
      if (user?.role === 'admin') {
        const sRes = await fetch('/api/stats/admin');
        setStats(await sRes.json());
      }
      
      if (activeTab === 'courses' || activeTab === 'dashboard') {
        const cRes = await fetch('/api/courses');
        setCourses(await cRes.json());
      }

      if (selectedCourse) {
        const mRes = await fetch(`/api/courses/${selectedCourse.id}/materials`);
        const aRes = await fetch(`/api/courses/${selectedCourse.id}/assessments`);
        setSelectedCourse({ ...selectedCourse, materials: await mRes.json(), assessments: await aRes.json() });
      }

      if (activeTab === 'vendors') {
        const vRes = await fetch('/api/vendors');
        setVendors(await vRes.json());
      }

      if (activeTab === 'colleges') {
        const clRes = await fetch('/api/colleges');
        setColleges(await clRes.json());
      }

      if (activeTab === 'management') {
        const uRes = await fetch('/api/users');
        setUsersList(await uRes.json());
      }

      if (activeTab === 'reports') {
        const rRes = await fetch(`/api/reports/${reportType}`);
        const data = await rRes.json();
        setReportData(Array.isArray(data) ? data : []);
      }

      // Default dashboard data
      if (activeTab === 'dashboard') {
        const rRes = await fetch('/api/students/report');
        const data = await rRes.json();
        setReportData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (type: string, method: string, id?: number) => {
    let url = id ? `/api/${type}/${id}` : `/api/${type}`;
    
    // Special handling for sub-resources
    if (type === 'material' || type === 'assessment') {
      url = `/api/courses/${selectedCourse.id}/${type}s`;
    }

    if (type === 'student-profile') {
      url = `/api/students/${formData.student_id}/profile`;
      method = 'PUT';
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify(formData) : undefined,
      });
      if (res.ok) {
        setShowModal(null);
        setFormData({});
        fetchData();
        if (type === 'student-profile' && user?.id === formData.student_id) {
          // Refresh current user data
          const userRes = await fetch(`/api/users/${user.id}`);
          if (userRes.ok) {
            const updatedUser = await userRes.json();
            setUser(updatedUser);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setActiveTab('dashboard');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadStudentFullReport = async (studentId: number, studentName: string) => {
    try {
      const res = await fetch(`/api/student/${studentId}/full-report`);
      const data = await res.json();
      
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(`${studentName} - Full Profile Report`, 14, 22);
      
      doc.setFontSize(14);
      doc.text('Personal Details', 14, 35);
      autoTable(doc, {
        startY: 40,
        head: [['Field', 'Value']],
        body: [
          ['Name', data.profile?.name || 'N/A'],
          ['Email', data.profile?.email || 'N/A'],
          ['College', data.profile?.college || 'N/A'],
          ['Department', data.profile?.department || 'N/A'],
          ['Batch', data.profile?.batch || 'N/A'],
          ['Phone', data.profile?.phone || 'N/A'],
          ['Gender', data.profile?.gender || 'N/A'],
        ],
      });

      doc.text('Academic & Placement Details', 14, (doc as any).lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Field', 'Value']],
        body: [
          ['CGPA', data.profile?.cgpa ? Number(data.profile.cgpa).toFixed(2) : 'N/A'],
          ['10th %', data.profile?.tenth_percent ? Number(data.profile.tenth_percent).toFixed(2) + '%' : 'N/A'],
          ['12th %', data.profile?.twelfth_percent ? Number(data.profile.twelfth_percent).toFixed(2) + '%' : 'N/A'],
          ['Placement Status', data.profile?.placement_status ? String(data.profile.placement_status).toUpperCase() : 'N/A'],
          ['Company', data.profile?.company_name || 'N/A'],
          ['Package (LPA)', data.profile?.package ? Number(data.profile.package).toFixed(2) : 'N/A'],
        ],
      });

      if (data.aptitude) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text('Skillset & Aptitude Profile', 14, 22);
        
        const skills = [
          { name: 'Logical Reasoning', score: Number(data.aptitude.logical) || 0 },
          { name: 'Quantitative', score: Number(data.aptitude.quant) || 0 },
          { name: 'Verbal', score: Number(data.aptitude.verbal) || 0 },
          { name: 'Programming', score: Number(data.aptitude.programming) || 0 },
          { name: 'Communication', score: Number(data.aptitude.communication) || 0 },
        ];

        let startY = 35;
        
        skills.forEach(skill => {
          doc.setFontSize(12);
          doc.setTextColor(50, 50, 50);
          doc.text(skill.name, 14, startY);

          // Draw background bar
          doc.setFillColor(241, 245, 249); // slate-100
          doc.rect(60, startY - 4, 100, 6, 'F');

          // Draw filled bar
          if (skill.score >= 80) doc.setFillColor(16, 185, 129); // emerald-500
          else if (skill.score >= 50) doc.setFillColor(245, 158, 11); // amber-500
          else doc.setFillColor(239, 68, 68); // red-500

          doc.rect(60, startY - 4, skill.score, 6, 'F');

          // Draw score text
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text(`${skill.score.toFixed(2)}%`, 165, startY);

          startY += 15;
        });

        // Add a summary text based on programming score
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42); // slate-900
        const progScore = Number(data.aptitude.programming) || 0;
        let summary = '';
        if (progScore >= 80) summary = 'Excellent technical foundation. Highly recommended for software engineering roles.';
        else if (progScore >= 50) summary = 'Good technical skills. Recommended for associate or junior developer roles.';
        else summary = 'Needs improvement in technical skills. Consider additional training before technical interviews.';
        
        doc.text('Overall Technical Assessment:', 14, startY + 10);
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(summary, 14, startY + 18, { maxWidth: 180 });
        
        (doc as any).lastAutoTable = { finalY: startY + 25 };
      }

      if (data.courses && data.courses.length > 0) {
        if ((doc as any).lastAutoTable.finalY > 250) doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('Enrolled Courses', 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Course Name', 'Progress (%)', 'Enrolled At']],
          body: data.courses.map((c: any) => [c.name, Number(c.progress || 0).toFixed(2) + '%', c.enrolled_at]),
        });
      }

      if (data.assessments && data.assessments.length > 0) {
        if ((doc as any).lastAutoTable.finalY > 250) doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('Assessment Results', 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Assessment', 'Score', 'Total Marks', 'Result']],
          body: data.assessments.map((a: any) => [a.title, Number(a.score || 0).toFixed(2), a.total_marks, a.passed ? 'Pass' : 'Fail']),
        });
      }

      doc.save(`${studentName.replace(/\s+/g, '_')}_Full_Report.pdf`);
    } catch (err) {
      console.error('Failed to download student report', err);
      alert('Failed to generate report.');
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${reportType}_report.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`${reportType.replace('-', ' ').toUpperCase()} REPORT`, 14, 15);
    if (Array.isArray(reportData) && reportData.length > 0) {
      const headers = Object.keys(reportData[0]);
      const body = reportData.map(row => Object.values(row));
      autoTable(doc, {
        head: [headers.map(h => h.replace('_', ' ').toUpperCase())],
        body: body,
        startY: 20,
      });
    }
    doc.save(`${reportType}_report.pdf`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-slate-100"
        >
          <div className="flex flex-col items-center mb-8">
            {/* <div className="bg-indigo-600 p-4 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
              <GraduationCap size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">EduPro LMS</h1> */}
            <img src={logo} alt="EduPro Logo" className="w-30 h-30 mb-4" />
            <p className="text-slate-500 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="admin@lms.com"
                value={loginForm.email}
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-widest">Demo Credentials</p>
            <div className="grid grid-cols-1 gap-2 text-[10px] text-slate-500 text-left">
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="font-bold text-indigo-600">Admin:</span> admin@lms.com / admin123
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="font-bold text-indigo-600">Vendor:</span> vendor@lms.com / vendor123
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="font-bold text-indigo-600">Trainer:</span> trainer@lms.com / trainer123
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="font-bold text-indigo-600">College:</span> college@lms.com / college123
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <span className="font-bold text-indigo-600">Student:</span> student@lms.com / student123
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-6 border-bottom border-slate-100 flex items-center gap-3">
         <img src={logo} alt="EduPro Logo" className="w-30 h-30 mb-4" />
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          {(user.role === 'admin' || user.role === 'vendor') && (
            <SidebarItem 
              icon={Building2} 
              label="Vendors" 
              active={activeTab === 'vendors'} 
              onClick={() => setActiveTab('vendors')} 
            />
          )}
          {(user.role === 'admin' || user.role === 'college') && (
            <SidebarItem 
              icon={School} 
              label="Colleges" 
              active={activeTab === 'colleges'} 
              onClick={() => setActiveTab('colleges')} 
            />
          )}
          {(user.role !== 'student') && (
            <SidebarItem 
              icon={Users} 
              label="Management" 
              active={activeTab === 'management'} 
              onClick={() => setActiveTab('management')} 
            />
          )}
          <SidebarItem 
            icon={BookOpen} 
            label="Courses" 
            active={activeTab === 'courses'} 
            onClick={() => setActiveTab('courses')} 
          />
          <div>
            <SidebarItem 
              icon={FileText} 
              label="Reports" 
              active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')} 
            />
            <AnimatePresence>
              {activeTab === 'reports' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-2"
                >
                  {REPORT_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all",
                        reportType === type.id 
                          ? "bg-indigo-50 text-indigo-600" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {user.role === 'student' && (
            <SidebarItem 
              icon={UserIcon} 
              label="My Profile" 
              active={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')} 
            />
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={() => setUser(null)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800 capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 rounded-full bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all w-64"
              />
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Total Vendors" value={stats.vendors || vendors.length} icon={Building2} color="bg-blue-500" />
                  <StatCard label="Total Colleges" value={stats.colleges || colleges.length} icon={School} color="bg-emerald-500" />
                  <StatCard label="Active Trainers" value={stats.trainers || 5} icon={Users} color="bg-amber-500" />
                  <StatCard label="Total Students" value={stats.students || (Array.isArray(reportData) ? reportData.length : 0)} icon={GraduationCap} color="bg-indigo-500" />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Student Performance Overview</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.studentPerformance || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="cgpa" fill="#6366f1" radius={[4, 4, 0, 0]} name="CGPA" />
                          <Bar dataKey="programming" fill="#10b981" radius={[4, 4, 0, 0]} name="Tech Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Placement Status Distribution</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Placed', value: stats.placementStats?.placed || 0 },
                              { name: 'Interview', value: stats.placementStats?.interview || 0 },
                              { name: 'Applied', value: stats.placementStats?.applied || 0 },
                              { name: 'Rejected', value: stats.placementStats?.rejected || 0 },
                            ].filter(d => d.value > 0)}
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#6366f1" />
                            <Cell fill="#10b981" />
                            <Cell fill="#fbbf24" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'vendors' && (
              <motion.div key="vendors" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">Vendor Management</h3>
                  <button 
                    onClick={() => { setShowModal('vendor'); setFormData({ name: '', contact_person: '', contact_email: '', contact_phone: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <Plus size={18} />
                    Add Vendor
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendors.map(v => (
                    <div key={v.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <Building2 className="text-indigo-600" size={32} />
                        <span className={cn(
                          "px-3 py-1 text-xs font-bold rounded-full uppercase",
                          v.status === 'active' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>{v.status}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">{v.name}</h3>
                      <div className="mt-6 pt-6 border-t border-slate-50 flex gap-2">
                        <button 
                          onClick={() => { setShowModal('vendor'); setFormData(v); }}
                          className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleAction('vendors', 'DELETE', v.id)}
                          className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'colleges' && (
              <motion.div key="colleges" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">College Management</h3>
                  <button 
                    onClick={() => { setShowModal('college'); setFormData({ name: '', spoc_name: '', spoc_email: '', address: '', city: '', state: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <Plus size={18} />
                    Add College
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {colleges.map(c => (
                    <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <School className="text-indigo-600 mb-4" size={32} />
                      <h3 className="text-lg font-bold text-slate-800">{c.name}</h3>
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-slate-500">SPOC: <span className="text-slate-700 font-medium">{c.spoc_name}</span></p>
                        <p className="text-xs text-slate-500">Email: <span className="text-slate-700 font-medium">{c.spoc_email}</span></p>
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-50 flex gap-2">
                        <button 
                          onClick={() => { setShowModal('college'); setFormData(c); }}
                          className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleAction('colleges', 'DELETE', c.id)}
                          className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'courses' && !selectedCourse && (
              <motion.div key="courses" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">Course Management</h3>
                  {user.role !== 'student' && (
                    <button 
                      onClick={() => { setShowModal('course'); setFormData({ name: '', description: '', duration: '', trainer_id: '', vendor_id: '', category: '', level: '' }); }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      <Plus size={18} />
                      Add Course
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="h-32 bg-indigo-600 flex items-center justify-center">
                        <BookOpen size={48} className="text-white/20" />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{c.duration}</span>
                          <Award size={16} className="text-amber-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{c.name}</h3>
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{c.description}</p>
                        <div className="mt-4 text-xs text-slate-400">
                          <p>Trainer: <span className="text-slate-600 font-medium">{c.trainer_name || 'Unassigned'}</span></p>
                          <p>Vendor: <span className="text-slate-600 font-medium">{c.vendor_name || 'N/A'}</span></p>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <button 
                            onClick={() => setSelectedCourse(c)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"
                          >
                            {user.role === 'student' ? 'Continue' : 'Manage'}
                          </button>
                          {user.role !== 'student' && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => { setShowModal('course'); setFormData(c); }}
                                className="text-slate-400 hover:text-indigo-600"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleAction('courses', 'DELETE', c.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'courses' && selectedCourse && (
              <motion.div key="course-detail" className="space-y-8">
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm"
                >
                  <ChevronRight className="rotate-180" size={18} />
                  Back to Courses
                </button>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-3xl font-bold text-slate-800">{selectedCourse.name}</h3>
                      <p className="text-slate-500 mt-2">{selectedCourse.description}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-slate-50 px-4 py-2 rounded-xl">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Duration</p>
                        <p className="text-sm font-bold text-slate-800">{selectedCourse.duration}</p>
                      </div>
                      <div className="bg-slate-50 px-4 py-2 rounded-xl">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Trainer</p>
                        <p className="text-sm font-bold text-slate-800">{selectedCourse.trainer_name || 'Unassigned'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Materials Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-slate-800">Learning Materials</h4>
                      {user.role !== 'student' && (
                        <button 
                          onClick={() => { setShowModal('material'); setFormData({ title: '', type: 'video', content: '', sort_order: (selectedCourse.materials?.length || 0) + 1 }); }}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {selectedCourse.materials?.map((m: any) => (
                        <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                              {m.type === 'video' ? <BarChart3 size={20} /> : <FileText size={20} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{m.title}</p>
                              <p className="text-xs text-slate-400 capitalize">{m.type}</p>
                            </div>
                          </div>
                          <button className="text-indigo-600 font-bold text-xs hover:underline">View</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assessments Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-slate-800">Assessments</h4>
                      {user.role !== 'student' && (
                        <button 
                          onClick={() => { setShowModal('assessment'); setFormData({ title: '', duration: 30, passing_marks: 70 }); }}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {selectedCourse.assessments?.map((a: any) => (
                        <div key={a.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
                              <Award size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{a.title}</p>
                              <p className="text-xs text-slate-400">{a.duration} mins | {a.passing_marks}% to pass</p>
                            </div>
                          </div>
                          <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">
                            {user.role === 'student' ? 'Take Test' : 'Manage'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">
                      {REPORT_TYPES.find(t => t.id === reportType)?.label || 'Comprehensive'} Report
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={exportToExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      <Download size={18} />
                      Excel
                    </button>
                    <button 
                      onClick={exportToPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                    >
                      <FileText size={18} />
                      PDF
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          {Array.isArray(reportData) && reportData.length > 0 && Object.keys(reportData[0]).filter(key => key !== 'student_id').map(key => (
                            <th key={key} className="px-6 py-4 font-semibold">{key.replace(/_/g, ' ')}</th>
                          ))}
                          {reportType === 'placement-readiness' && (
                            <th className="px-6 py-4 font-semibold text-right">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Array.isArray(reportData) && reportData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            {Object.entries(row).filter(([key]) => key !== 'student_id').map(([key, val]: [string, any], i) => {
                              let cellContent: any = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val;
                              let cellClass = "px-6 py-4 text-sm text-slate-600";
                              
                              // Add some color coding based on value or key
                              if (key.includes('score') || key === 'cgpa' || key.includes('percent')) {
                                const numVal = parseFloat(val);
                                if (!isNaN(numVal)) {
                                  const displayVal = numVal.toFixed(2);
                                  if (numVal >= 80 || (key === 'cgpa' && numVal >= 8.0)) {
                                    cellContent = <span className="text-emerald-600 font-bold">{displayVal}</span>;
                                  } else if (numVal < 50 || (key === 'cgpa' && numVal < 6.0)) {
                                    cellContent = <span className="text-red-600 font-bold">{displayVal}</span>;
                                  } else {
                                    cellContent = <span className="text-amber-600 font-bold">{displayVal}</span>;
                                  }
                                }
                              } else if (key === 'status' || key === 'placement_status' || key === 'result') {
                                const statusStr = String(val).toLowerCase();
                                if (statusStr === 'placed' || statusStr === 'pass' || statusStr === 'submitted') {
                                  cellContent = <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">{val}</span>;
                                } else if (statusStr === 'rejected' || statusStr === 'fail' || statusStr === 'not submitted') {
                                  cellContent = <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">{val}</span>;
                                } else if (val) {
                                  cellContent = <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase">{val}</span>;
                                }
                              }

                              return (
                                <td key={i} className={cellClass}>
                                  {cellContent}
                                </td>
                              );
                            })}
                            {reportType === 'placement-readiness' && (
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => downloadStudentFullReport(row.student_id, row.name)}
                                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors"
                                >
                                  Download PDF
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && user.role === 'student' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold">
                      {user.name[0]}
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-slate-800">{user.name}</h3>
                      <p className="text-slate-500">{user.email}</p>
                      <span className="inline-block mt-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase">
                        Student ID: {user.id}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-800 border-b pb-2">Academic Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold">Department</p>
                          <p className="font-medium text-slate-700">{user.department || 'Not Set'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold">Batch</p>
                          <p className="font-medium text-slate-700">{user.batch || 'Not Set'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold">CGPA</p>
                          <p className="font-medium text-slate-700">{user.cgpa || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-bold">Attendance</p>
                          <p className="font-medium text-slate-700">{user.attendance || '0'}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-800 border-b pb-2">Placement Status</h4>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-600">Current Status</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            user.placement_status === 'placed' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                          )}>
                            {user.placement_status || 'In Progress'}
                          </span>
                        </div>
                        {user.package && (
                          <p className="text-2xl font-bold text-slate-800">{user.package} LPA</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end">
                    <button 
                      onClick={() => { setShowModal('student-profile'); setFormData({ student_id: user.id, ...user }); }}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Update Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'management' && (
              <motion.div key="management" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-slate-800">User Management</h3>
                  <button 
                    onClick={() => { setShowModal('user'); setFormData({ name: '', email: '', password: '', role: 'student' }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <Plus size={18} />
                    Add User
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Name</th>
                        <th className="px-6 py-4 font-semibold">Email</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-800">{u.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{u.role}</span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            {u.role === 'student' && (
                              <button 
                                onClick={() => { setShowModal('student-profile'); setFormData({ student_id: u.id, ...u }); }}
                                className="text-emerald-600 hover:text-emerald-900 font-bold text-sm"
                              >
                                Profile
                              </button>
                            )}
                            <button onClick={() => handleAction('users', 'DELETE', u.id)} className="text-red-500 hover:text-red-700 font-bold text-sm">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modal System */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-slate-800 mb-6 capitalize">
              {formData.id ? 'Edit' : 'Add'} {showModal}
            </h3>
            <div className="space-y-4">
              {showModal === 'vendor' && (
                <>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Vendor Name"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contact Person"
                    value={formData.contact_person || ''}
                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contact Email"
                    value={formData.contact_email || ''}
                    onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contact Phone"
                    value={formData.contact_phone || ''}
                    onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </>
              )}
              {showModal === 'college' && (
                <>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="College Name"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="SPOC Name"
                    value={formData.spoc_name || ''}
                    onChange={e => setFormData({ ...formData, spoc_name: e.target.value })}
                  />
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="SPOC Email"
                    value={formData.spoc_email || ''}
                    onChange={e => setFormData({ ...formData, spoc_email: e.target.value })}
                  />
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Address"
                    value={formData.address || ''}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="City"
                      value={formData.city || ''}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                    />
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="State"
                      value={formData.state || ''}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </>
              )}
              {showModal === 'course' && (
                <>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Course Name"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Description"
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Duration (e.g. 12 Weeks)"
                      value={formData.duration || ''}
                      onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    />
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Category"
                      value={formData.category || ''}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.level || ''}
                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                  >
                    <option value="">Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </>
              )}
              {showModal === 'user' && (
                <>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Full Name"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Password"
                    type="password"
                    value={formData.password || ''}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.role || ''}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="trainer">Trainer</option>
                    <option value="college">College Admin</option>
                    <option value="vendor">Vendor Admin</option>
                  </select>
                  {formData.role === 'student' && (
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.college_id || ''}
                      onChange={e => setFormData({ ...formData, college_id: e.target.value })}
                    >
                      <option value="">Select College</option>
                      {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </>
              )}
              {showModal === 'student-profile' && (
                <div className="grid grid-cols-2 gap-4">
                  <input className="px-4 py-3 rounded-xl border border-slate-200" placeholder="Gender" value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value })} />
                  <input className="px-4 py-3 rounded-xl border border-slate-200" type="date" value={formData.dob || ''} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                  <input className="px-4 py-3 rounded-xl border border-slate-200" placeholder="Phone" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  <input className="px-4 py-3 rounded-xl border border-slate-200" placeholder="Department" value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                  <input className="px-4 py-3 rounded-xl border border-slate-200" placeholder="Batch" value={formData.batch || ''} onChange={e => setFormData({ ...formData, batch: e.target.value })} />
                  <input className="px-4 py-3 rounded-xl border border-slate-200" placeholder="CGPA" type="number" step="0.01" value={formData.cgpa || ''} onChange={e => setFormData({ ...formData, cgpa: parseFloat(e.target.value) })} />
                  <input className="px-4 py-3 rounded-xl border border-slate-200" placeholder="10th %" type="number" value={formData.tenth_percent || ''} onChange={e => setFormData({ ...formData, tenth_percent: parseFloat(e.target.value) })} />
                  <input className="px-4 py-3 rounded-xl border border-slate-200" placeholder="12th %" type="number" value={formData.twelfth_percent || ''} onChange={e => setFormData({ ...formData, twelfth_percent: parseFloat(e.target.value) })} />
                  <textarea className="col-span-2 px-4 py-3 rounded-xl border border-slate-200" placeholder="Address" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
              )}
              {showModal === 'question' && (
                <div className="space-y-4">
                  <input className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Topic" value={formData.topic || ''} onChange={e => setFormData({ ...formData, topic: e.target.value })} />
                  <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Question Text" value={formData.question || ''} onChange={e => setFormData({ ...formData, question: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map(i => (
                      <input 
                        key={i}
                        className="px-4 py-2 rounded-lg border border-slate-200" 
                        placeholder={`Option ${i+1}`} 
                        value={formData.options?.[i] || ''} 
                        onChange={e => {
                          const newOptions = [...(formData.options || ['', '', '', ''])];
                          newOptions[i] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }} 
                      />
                    ))}
                  </div>
                  <input className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Correct Answer" value={formData.correct_answer || ''} onChange={e => setFormData({ ...formData, correct_answer: e.target.value })} />
                </div>
              )}
              {showModal === 'material' && (
                <>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Material Title"
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.type || ''}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="ppt">PPT</option>
                    <option value="text">Text</option>
                  </select>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Content URL or Text"
                    value={formData.content || ''}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                  />
                </>
              )}
              {showModal === 'assessment' && (
                <>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Assessment Title"
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Duration (minutes)"
                    type="number"
                    value={formData.duration || ''}
                    onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  />
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Passing Marks (%)"
                    type="number"
                    value={formData.passing_marks || ''}
                    onChange={e => setFormData({ ...formData, passing_marks: parseInt(e.target.value) })}
                  />
                </>
              )}
            </div>
            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setShowModal(null)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleAction(showModal === 'user' ? 'users' : showModal + 's', formData.id ? 'PUT' : 'POST', formData.id)}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Save {showModal}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
