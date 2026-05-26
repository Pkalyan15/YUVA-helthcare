import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  User, 
  Users,
  Calendar, 
  LogOut, 
  ChevronRight, 
  Plus, 
  Check, 
  X, 
  Stethoscope, 
  ShieldAlert, 
  Settings, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Mail, 
  Phone, 
  Heart, 
  Sparkles, 
  Brain, 
  Menu, 
  BadgeAlert,
  Save,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { UserProfile, DoctorProfile, Appointment, DashboardStats } from './types';

export default function App() {
  // Navigation & View States
  const [currentView, setCurrentView] = useState<
    'home' | 'doctors' | 'about' | 'contact' | 'login' | 'booking' | 'patient-dashboard' | 'doctor-dashboard' | 'admin-dashboard'
  >('home');
  
  const [selectedSpecialityFilter, setSelectedSpecialityFilter] = useState<string>('');
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<DoctorProfile | null>(null);
  
  // Auth States
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | 'admin' | null>(
    (localStorage.getItem('userRole') as any) || null
  );
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentDoctor, setCurrentDoctor] = useState<DoctorProfile | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerGender, setRegisterGender] = useState<'Male' | 'Female' | 'Not Selected'>('Not Selected');
  const [registerDob, setRegisterDob] = useState('2004-05-26');
  const [registerAddress, setRegisterAddress] = useState('');
  const [authMode, setAuthMode] = useState<'patient_login' | 'patient_register' | 'doctor_login' | 'admin_login'>('patient_login');

  // Booking Form state
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');

  // Admin New Doctor state
  const [newDocName, setNewDocName] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocPassword, setNewDocPassword] = useState('');
  const [newDocSpeciality, setNewDocSpeciality] = useState<DoctorProfile['speciality']>('General physician');
  const [newDocDegree, setNewDocDegree] = useState('MBBS');
  const [newDocExperience, setNewDocExperience] = useState('3 Years');
  const [newDocFees, setNewDocFees] = useState(70);
  const [newDocAbout, setNewDocAbout] = useState('');
  const [newDocAddress, setNewDocAddress] = useState('');
  const [newDocImage, setNewDocImage] = useState('');

  // Edit patient profile state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female' | 'Not Selected'>('Not Selected');
  const [editDob, setEditDob] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Edit doctor profile state
  const [editDocSpeciality, setEditDocSpeciality] = useState<DoctorProfile['speciality']>('General physician');
  const [editDocDegree, setEditDocDegree] = useState('');
  const [editDocExperience, setEditDocExperience] = useState('');
  const [editDocFees, setEditDocFees] = useState(0);
  const [editDocAbout, setEditDocAbout] = useState('');
  const [editDocAddress, setEditDocAddress] = useState('');
  const [editDocAvailable, setEditDocAvailable] = useState(true);

  // Operational Data lists
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [doctorAppointments, setDoctorAppointments] = useState<Appointment[]>([]);
  const [adminAppointments, setAdminAppointments] = useState<Appointment[]>([]);
  const [adminDashboardStats, setAdminDashboardStats] = useState<DashboardStats | null>(null);

  // Loading & Custom Notification Toast States
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Run initial loading
  useEffect(() => {
    fetchDoctors();
    if (token && userRole) {
      if (userRole === 'patient') {
        fetchPatientProfile();
        fetchPatientAppointments();
      } else if (userRole === 'doctor') {
        fetchDoctorProfile();
        fetchDoctorAppointments();
      } else if (userRole === 'admin') {
        fetchAdminDashboard();
        fetchAdminAppointments();
      }
    }
  }, [token, userRole]);

  // Fetch doctors registry
  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctor/list');
      const data = await res.json();
      if (data.success) {
        setDoctorsList(data.doctors);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  // Fetch user profile info
  const fetchPatientProfile = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        headers: { token }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.userData);
        // prefill inputs
        setEditName(data.userData.name);
        setEditPhone(data.userData.phone);
        setEditGender(data.userData.gender);
        setEditDob(data.userData.dob);
        setEditAddress(data.userData.address);
        setEditAvatar(data.userData.avatar || '');
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Save updated user profile
  const handleUpdatePatientProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          gender: editGender,
          dob: editDob,
          address: editAddress,
          avatar: editAvatar
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.userData);
        setIsEditingProfile(false);
        showToast('Your profile information has been securely updated!');
      } else {
        showToast(data.message || 'Error updating profile', 'error');
      }
    } catch (err) {
      showToast('API communication error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch patient booked list
  const fetchPatientAppointments = async () => {
    try {
      const res = await fetch('/api/user/appointments', {
        headers: { token }
      });
      const data = await res.json();
      if (data.success) {
        setPatientAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel Patient appointment
  const handleCancelPatientAppointment = async (apptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch('/api/user/cancel-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ appointmentId: apptId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Appointment successfully cancelled');
        fetchPatientAppointments();
        fetchDoctors(); // reload availability
      } else {
        showToast(data.message || 'Cancellation failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  // Fetch doctor profile settings
  const fetchDoctorProfile = async () => {
    try {
      const res = await fetch('/api/doctor/profile', {
        headers: { dtoken: token }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentDoctor(data.profileData);
        setEditDocSpeciality(data.profileData.speciality);
        setEditDocDegree(data.profileData.degree);
        setEditDocExperience(data.profileData.experience);
        setEditDocFees(data.profileData.fees);
        setEditDocAbout(data.profileData.about);
        setEditDocAddress(data.profileData.address);
        setEditDocAvailable(data.profileData.available);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update doctor availability
  const toggleDocAvailability = async () => {
    try {
      const res = await fetch('/api/doctor/change-availability', {
        method: 'POST',
        headers: { dtoken: token }
      });
      const data = await res.json();
      if (data.success) {
        setEditDocAvailable(!editDocAvailable);
        showToast('Availability status updated');
        fetchDoctorProfile();
      }
    } catch (err) {
      showToast('Failed to change status', 'error');
    }
  };

  // Save Doctor profile modifications
  const handleUpdateDoctorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/doctor/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          dtoken: token
        },
        body: JSON.stringify({
          speciality: editDocSpeciality,
          degree: editDocDegree,
          experience: editDocExperience,
          about: editDocAbout,
          fees: Number(editDocFees),
          address: editDocAddress,
          available: editDocAvailable
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentDoctor(data.profileData);
        showToast('Doctor credentials updated with success');
      } else {
        showToast(data.message || 'Failed to apply credentials', 'error');
      }
    } catch (err) {
      showToast('Communication fault', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch doctor clients
  const fetchDoctorAppointments = async () => {
    try {
      const res = await fetch('/api/doctor/appointments', {
        headers: { dtoken: token }
      });
      const data = await res.json();
      if (data.success) {
        setDoctorAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel Doctor client
  const handleCancelDoctorAppointment = async (apptId: string) => {
    if (!confirm('Cancel this patients session?')) return;
    try {
      const res = await fetch('/api/doctor/cancel-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', dtoken: token },
        body: JSON.stringify({ appointmentId: apptId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Session status: CANCELLED');
        fetchDoctorAppointments();
      }
    } catch (err) {
      showToast('Failed cancelling', 'error');
    }
  };

  // Complete Doctor client
  const handleCompleteDoctorAppointment = async (apptId: string) => {
    try {
      const res = await fetch('/api/doctor/complete-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', dtoken: token },
        body: JSON.stringify({ appointmentId: apptId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Session completed, invoice marked PAID');
        fetchDoctorAppointments();
      }
    } catch (err) {
      showToast('Fail completing', 'error');
    }
  };

  // Fetch admin monitor components
  const fetchAdminDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { atoken: token }
      });
      const data = await res.json();
      if (data.success) {
        setAdminDashboardStats(data.dashData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminAppointments = async () => {
    try {
      const res = await fetch('/api/admin/appointments', {
        headers: { atoken: token }
      });
      const data = await res.json();
      if (data.success) {
        setAdminAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin cancels a booking
  const handleAdminCancelAppointment = async (apptId: string) => {
    if (!confirm('As Admin, cancel this booking?')) return;
    try {
      const res = await fetch('/api/admin/cancel-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', atoken: token },
        body: JSON.stringify({ appointmentId: apptId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Booking Cancelled by Admin');
        fetchAdminAppointments();
        fetchAdminDashboard();
        fetchDoctors();
      }
    } catch (err) {
      showToast('Error', 'error');
    }
  };

  // Admin toggles any doctor availability
  const handleAdminToggleDocAvailability = async (docId: string) => {
    try {
      const res = await fetch('/api/admin/change-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', atoken: token },
        body: JSON.stringify({ docId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Specialist status modified');
        fetchDoctors();
        fetchAdminDashboard();
      }
    } catch (err) {
      showToast('Error', 'error');
    }
  };

  // Create new medical doctor from Admin Panel
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocEmail || !newDocPassword) {
      showToast('Please fill all mandatory doctor fields', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/add-doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          atoken: token
        },
        body: JSON.stringify({
          name: newDocName,
          email: newDocEmail,
          password: newDocPassword,
          speciality: newDocSpeciality,
          degree: newDocDegree,
          experience: newDocExperience,
          fees: Number(newDocFees),
          about: newDocAbout,
          address: newDocAddress,
          image: newDocImage
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Expert Dr. ${newDocName} added to registry!`);
        // clear inputs
        setNewDocName('');
        setNewDocEmail('');
        setNewDocPassword('');
        setNewDocDegree('MBBS');
        setNewDocExperience('3 Years');
        setNewDocFees(70);
        setNewDocAbout('');
        setNewDocAddress('');
        setNewDocImage('');
        // refresh data
        fetchDoctors();
        fetchAdminDashboard();
        fetchAdminAppointments();
      } else {
        showToast(data.message || 'Error creating profile', 'error');
      }
    } catch (err) {
      showToast('Faulty connection', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Perform Patient Registration
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) {
      showToast('Fields with * are required', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          phone: registerPhone,
          dob: registerDob,
          gender: registerGender,
          address: registerAddress
        })
      });
      const data = await res.json();
      if (data.success) {
        saveSession(data.token, 'patient');
        showToast(`Welcome to Yuvacare, ${registerName}!`);
        setCurrentView('home');
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Perform unified Login (Patient, Doctor, Admin)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('Credentials are required', 'error');
      return;
    }
    setIsLoading(true);
    
    let url = '/api/user/login';
    let role: 'patient' | 'doctor' | 'admin' = 'patient';

    if (authMode === 'doctor_login') {
      url = '/api/doctor/login';
      role = 'doctor';
    } else if (authMode === 'admin_login') {
      url = '/api/admin/login';
      role = 'admin';
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        saveSession(data.token, role);
        showToast('Access authorized successfully!');
        
        if (role === 'patient') {
          setCurrentView('home');
        } else if (role === 'doctor') {
          setCurrentView('doctor-dashboard');
        } else if (role === 'admin') {
          setCurrentView('admin-dashboard');
        }
      } else {
        showToast(data.message || 'Authentication error', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to authentication server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = (t: string, r: 'patient' | 'doctor' | 'admin') => {
    localStorage.setItem('token', t);
    localStorage.setItem('userRole', r);
    setToken(t);
    setUserRole(r);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setToken('');
    setUserRole(null);
    setCurrentUser(null);
    setCurrentDoctor(null);
    showToast('Securely signed out. Have a healthy day!');
    setCurrentView('home');
  };

  // Interactive Bookings Submission
  const handleConfirmAppointmentBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('Please login to book an appointment', 'error');
      setAuthMode('patient_login');
      setCurrentView('login');
      return;
    }
    if (userRole !== 'patient') {
      showToast('Please sign in as a Patient to book sessions', 'error');
      return;
    }
    if (!bookingDate || !bookingTime) {
      showToast('Please select calendar date and available time slot', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/user/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          doctorId: selectedDoctorForBooking?.id,
          slotDate: bookingDate,
          slotTime: bookingTime
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Your medical session is booked! Check local schedule.', 'success');
        fetchPatientAppointments();
        setCurrentView('patient-dashboard');
      } else {
        showToast(data.message || 'Cannot apply booking', 'error');
      }
    } catch (err) {
      showToast('Booking failed. Network issues.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper specialty array with styling icons and descriptions
  const SPECIALITIES_INDEX = [
    { name: 'General physician', icon: Activity, desc: 'Pristine physical checkups and acute care primary medicine.' },
    { name: 'Gynecologist', icon: Heart, desc: 'Tailored feminine biology solutions, early screening and guidance.' },
    { name: 'Dermatologist', icon: Sparkles, desc: 'Sleek cosmetic skin treatments, allergy management and skincare.' },
    { name: 'Pediatrician', icon: Users, desc: 'Warm pediatric consultations, child immunisation, developmental tracing.' },
    { name: 'Neurologist', icon: Brain, desc: 'Surgical brain evaluations and absolute neuromuscular treatments.' },
    { name: 'Gastroenterologist', icon: Stethoscope, desc: 'Advanced digestive wellness solutions, stomach, and bowel tracking.' }
  ];

  // Dynamic Date calculation for 7 Upcoming Days
  const getNext7Days = () => {
    const dates = [];
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        dayName: daysOfWeek[d.getDay()],
        dayNumber: d.getDate(),
        month: months[d.getUTCMonth()],
        formatted: d.toISOString().split('T')[0] // YYYY-MM-DD
      });
    }
    return dates;
  };

  // Quick seed logs to ease local preview testing
  const fillCredentials = (role: 'patient' | 'doctor' | 'admin') => {
    if (role === 'patient') {
      setAuthMode('patient_login');
      setLoginEmail('pavan@example.com');
      setLoginPassword('user123');
    } else if (role === 'doctor') {
      setAuthMode('doctor_login');
      setLoginEmail('emily.larson@yuvacare.com');
      setLoginPassword('doctor123');
    } else if (role === 'admin') {
      setAuthMode('admin_login');
      setLoginEmail('yuva@example.com');
      setLoginPassword('yuva@123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-teal-500 selection:text-white">
      
      {/* 1. Global Alert Toast */}
      {toast && (
        <div id="toast-wrapper" className="fixed top-5 right-5 z-50 animate-bounce">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border ${
            toast.type === 'success' 
              ? 'bg-teal-900 text-teal-100 border-teal-500' 
              : 'bg-rose-900 text-rose-100 border-rose-500'
          }`}>
            {toast.type === 'success' ? <Check className="w-5 h-5 text-teal-400" /> : <ShieldAlert className="w-5 h-5 text-rose-400" />}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 2. Top Navigation header */}
      <header id="yuvacare-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                Yuvacare
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Healthcare</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button 
              onClick={() => { setCurrentView('home'); setSelectedSpecialityFilter(''); }} 
              className={`hover:text-teal-600 transition-colors ${currentView === 'home' ? 'text-teal-600 border-b-2 border-teal-500 py-1' : ''}`}
            >
              HOME
            </button>
            <button 
              onClick={() => { setCurrentView('doctors'); }} 
              className={`hover:text-teal-600 transition-colors ${currentView === 'doctors' ? 'text-teal-600 border-b-2 border-teal-500 py-1' : ''}`}
            >
              ALL DOCTORS
            </button>
            <button 
              onClick={() => setCurrentView('about')} 
              className={`hover:text-teal-600 transition-colors ${currentView === 'about' ? 'text-teal-600 border-b-2 border-teal-500 py-1' : ''}`}
            >
              ABOUT US
            </button>
            <button 
              onClick={() => setCurrentView('contact')} 
              className={`hover:text-teal-600 transition-colors ${currentView === 'contact' ? 'text-teal-600 border-b-2 border-teal-500 py-1' : ''}`}
            >
              CONTACT
            </button>
          </nav>

          {/* Account Right panel */}
          <div className="flex items-center gap-3">
            {token ? (
              <div className="flex items-center gap-4">
                
                {/* User role indicators routing to dashboard panels */}
                {userRole === 'patient' && (
                  <button 
                    onClick={() => setCurrentView('patient-dashboard')}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    MY PROFILE
                  </button>
                )}

                {userRole === 'doctor' && (
                  <button 
                    onClick={() => setCurrentView('doctor-dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold hover:bg-teal-100 transition-all"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    DOCTOR OFFICE
                  </button>
                )}

                {userRole === 'admin' && (
                  <button 
                    onClick={() => setCurrentView('admin-dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-slate-100 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all"
                  >
                    <Settings className="w-3.5 h-3.5 text-teal-400 animate-spin-slow" />
                    ADMIN CONTROL
                  </button>
                )}

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SIGN OUT</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setAuthMode('patient_login'); setCurrentView('login'); }}
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Create account
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. Main content body */}
      <main className="flex-grow">
        
        {/* ==================== SCREEN 1: HOME PANEL ==================== */}
        {currentView === 'home' && (
          <div className="animate-fade-in">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-7 flex flex-col justify-center space-y-6 md:space-y-8">
                
                {/* Trust pill */}
                <div className="inline-flex items-center gap-2 self-start bg-teal-50 border border-teal-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-teal-800 uppercase tracking-wider">
                  <Heart className="w-3.5 h-3.5 text-teal-500 fill-current" />
                  YUVACARE LIVE HEALTH SYSTEM
                </div>
                
                <h1 className="text-4.5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                  Book Appointment <br />
                  <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">With Trusted Doctors</span>
                </h1>
                
                <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                  Simply browse through our extensive list of vetted healthcare specialists, coordinate with your personal calendar, and book secure medical appointments hassle-free.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setCurrentView('doctors')}
                    className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-teal-700 hover:scale-105 active:scale-95 shadow-lg shadow-teal-600/20 transition-all cursor-pointer"
                  >
                    Book appointment
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCurrentView('about')}
                    className="inline-flex items-center justify-center bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 px-8 py-4 rounded-xl text-base font-semibold transition-all"
                  >
                    Learn about our clinic
                  </button>
                </div>

                {/* Patient stats overview banner */}
                <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-center sm:text-left">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">100%</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Verified Doctors</p>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">70+ INR</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Base consultation</p>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">24/7</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Local Scheduling</p>
                  </div>
                </div>
              </div>

              {/* Decorative Medical Hero Banner right */}
              <div className="hidden lg:col-span-5 lg:flex items-center justify-center p-4">
                <div className="relative w-full aspect-square max-w-md">
                  {/* Decorative ambient backgrounds */}
                  <div className="absolute inset-4 rounded-3xl bg-teal-100 rotate-6 shadow-md shadow-teal-200"></div>
                  <div className="absolute inset-4 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 -rotate-3 overflow-hidden shadow-2xl flex flex-col justify-between p-8 text-white">
                    <div>
                      <Stethoscope className="w-12 h-12 text-teal-400 mb-6" />
                      <h3 className="text-2xl font-bold font-sans">Yuvacare Health</h3>
                      <p className="text-xs font-semibold tracking-widest text-teal-400/80 uppercase mt-1">Noble College, Bangalore</p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                        <div>
                          <p className="text-xs font-semibold">Active Appointment Sessions</p>
                          <p className="text-[10px] text-white/70">Connect with local Bangalore medical experts instantly</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-white/50 pt-2 font-mono">
                        <span>VI Semester BCA</span>
                        <span>Project 2025-2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Find By Speciality Category Lists */}
            <div className="bg-white border-y border-slate-200 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-3 mb-12">
                  <h2 className="text-3xl font-black text-slate-900">Find by Speciality</h2>
                  <p className="text-slate-600 max-w-lg mx-auto">
                    Simply select from our range of verified medical categories to browse and book certified physicians instantly.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {SPECIALITIES_INDEX.map((spec) => {
                    const SpecIcon = spec.icon;
                    return (
                      <div 
                        key={spec.name}
                        onClick={() => {
                          setSelectedSpecialityFilter(spec.name);
                          setCurrentView('doctors');
                        }}
                        className="group flex flex-col items-center p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-teal-50 hover:border-teal-300 hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer text-center"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center text-teal-600 transition-colors shadow-sm mb-4">
                          <SpecIcon className="w-7 h-7" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 leading-tight group-hover:text-teal-900">{spec.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-tight">{spec.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Doctors Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
                <div className="space-y-2 text-center sm:text-left">
                  <h2 className="text-3xl font-black text-slate-900">Highly Rated Medical Specialists</h2>
                  <p className="text-slate-600">Explore certified clinical experts in Bengaluru with open schedules.</p>
                </div>
                <button 
                  onClick={() => setCurrentView('doctors')}
                  className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-6 py-3 border border-teal-200 rounded-xl text-sm font-semibold transition-all"
                >
                  View complete registry
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {doctorsList.slice(0, 4).map((doc) => (
                  <div 
                    key={doc.id}
                    className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Doctor Image banner */}
                      <div className="relative aspect-[4/3] bg-teal-50 overflow-hidden">
                        {doc.image ? (
                          <img src={doc.image} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-teal-400">
                            <Stethoscope className="w-16 h-16" />
                          </div>
                        )}
                        {/* Status tag */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white shadow-sm">
                          <span className={`w-2 h-2 rounded-full ${doc.available ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}></span>
                          <span className={doc.available ? 'text-emerald-700' : 'text-rose-700'}>
                            {doc.available ? 'Available' : 'Busy'}
                          </span>
                        </div>
                      </div>

                      {/* Doctor textual panel */}
                      <div className="p-5 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-teal-600 tracking-wider uppercase">{doc.speciality}</p>
                          <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-teal-600 transition-colors mt-0.5">{doc.name}</h3>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-medium">{doc.degree}</span>
                          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-medium">{doc.experience} Experience</span>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {doc.about || 'Dedicated healthcare physician specializing in outpatient diagnostic analytics and personal clinical sessions.'}
                        </p>
                      </div>
                    </div>

                    {/* Footer fee & select button */}
                    <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-4 h-16">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Fees structure</span>
                        <span className="text-base font-black text-teal-600">₹{doc.fees}.00</span>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedDoctorForBooking(doc);
                          setBookingDate(getNext7Days()[0].formatted);
                          setBookingTime(doc.availableTimeSlots[0] || '10:00 AM');
                          setCurrentView('booking');
                        }}
                        className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 hover:bg-teal-600 text-xs font-bold' rounded-lg transition-all transform active:scale-95 cursor-pointer"
                      >
                        BOOK SLOT
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 2: ALL DOCTORS REGISTRY ==================== */}
        {currentView === 'doctors' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            <div className="space-y-2 mb-10 text-center sm:text-left">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Browse Certified Specialist Doctors</h1>
              <p className="text-slate-600">Filter through our Bengaluru clinical hub to book tailored expert counseling sessions instantly.</p>
            </div>

            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              
              {/* Category sidebar filter left */}
              <div className="lg:col-span-3 space-y-3 mb-8 lg:mb-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Speciality Filters</span>
                
                <button 
                  onClick={() => setSelectedSpecialityFilter('')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                    selectedSpecialityFilter === ''
                      ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-500/10'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Specialists
                </button>

                {SPECIALITIES_INDEX.map((spec) => (
                  <button 
                    key={spec.name}
                    onClick={() => setSelectedSpecialityFilter(spec.name)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all border flex items-center justify-between ${
                      selectedSpecialityFilter === spec.name
                        ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{spec.name}</span>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </button>
                ))}
              </div>

              {/* Specialist listing grid right */}
              <div className="lg:col-span-9 col-span-1">
                {isLoading ? (
                  <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Updating active medical directories...</p>
                  </div>
                ) : (
                  <>
                    {/* Render Filtered specialists */}
                    {doctorsList.filter(d => !selectedSpecialityFilter || d.speciality === selectedSpecialityFilter).length === 0 ? (
                      <div className="bg-white border rounded-2xl p-12 text-center text-slate-500 space-y-4">
                        <BadgeAlert className="w-12 h-12 text-slate-300 mx-auto" />
                        <h3 className="text-lg font-bold text-slate-800">No Specialists found</h3>
                        <p className="text-sm max-w-sm mx-auto">
                          There are currently no doctors loaded under '{selectedSpecialityFilter}'. Modify or clear the specialty filter.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctorsList
                          .filter(d => !selectedSpecialityFilter || d.speciality === selectedSpecialityFilter)
                          .map((doc) => (
                            <div 
                              key={doc.id}
                              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="relative aspect-[4/3] bg-teal-50 overflow-hidden">
                                  {doc.image ? (
                                    <img src={doc.image} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-teal-400">
                                      <Stethoscope className="w-14 h-14" />
                                    </div>
                                  )}
                                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white">
                                    <span className={`w-2 h-2 rounded-full ${doc.available ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}></span>
                                    <span>{doc.available ? 'Available' : 'Busy'}</span>
                                  </div>
                                </div>

                                <div className="p-5 space-y-2">
                                  <p className="text-xs font-bold text-teal-600 tracking-wider uppercase">{doc.speciality}</p>
                                  <h3 className="font-extrabold text-slate-900 text-base">{doc.name}</h3>
                                  
                                  <div className="flex flex-wrap gap-1.5 text-xs text-slate-400 pt-1">
                                    <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">{doc.degree}</span>
                                    <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">{doc.experience} Exp</span>
                                  </div>

                                  <p className="text-xs text-slate-500 line-clamp-3 pt-2 bg-slate-50/50 p-2 rounded border border-slate-100">
                                    {doc.about || 'Dedicated care specialist facilitating secure consultations in general medicine and family diagnosis.'}
                                  </p>
                                </div>
                              </div>

                              <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-4 h-16">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fees</span>
                                  <span className="text-sm font-black text-teal-600">₹{doc.fees}</span>
                                </div>

                                <button 
                                  onClick={() => {
                                    setSelectedDoctorForBooking(doc);
                                    setBookingDate(getNext7Days()[0].formatted);
                                    setBookingTime(doc.availableTimeSlots[0] || '10:00 AM');
                                    setCurrentView('booking');
                                  }}
                                  className="bg-slate-900 hover:bg-teal-600 text-white text-xs font-semibold px-4.5 py-2 rounded-lg transition-colors cursor-pointer"
                                >
                                  Book Slot
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 3: DOCTOR DETAILED BOOKING ==================== */}
        {currentView === 'booking' && selectedDoctorForBooking && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            
            {/* Back CTA */}
            <button 
              onClick={() => setCurrentView('doctors')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-600 hover:text-teal-700 mb-8 cursor-pointer"
            >
              ← Back to Specialists Registry
            </button>

            {/* Doctor Card header panel */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 md:grid md:grid-cols-12 md:gap-8 shadow-sm">
              <div className="md:col-span-4 aspect-square rounded-2xl overflow-hidden bg-slate-100 border mb-6 md:mb-0 max-w-sm mx-auto">
                {selectedDoctorForBooking.image ? (
                  <img src={selectedDoctorForBooking.image} alt={selectedDoctorForBooking.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-teal-300">
                    <Stethoscope className="w-20 h-20" />
                  </div>
                )}
              </div>

              <div className="md:col-span-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-teal-50 text-teal-700 px-3 py-1 border border-teal-200 rounded-full text-xs font-bold uppercase tracking-wider">
                      {selectedDoctorForBooking.speciality}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-slate-500 text-xs font-semibold">{selectedDoctorForBooking.degree}</span>
                  </div>

                  <h1 className="text-3xl font-black text-slate-900 mt-2 flex items-center gap-2">
                    {selectedDoctorForBooking.name}
                    <CheckCircle className="w-5 h-5 text-teal-500 fill-teal-50" />
                  </h1>

                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{selectedDoctorForBooking.experience} CLINICAL STUDY & EXPERIENCE</p>
                  
                  <div className="mt-6 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">PROVIDER BIO</span>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {selectedDoctorForBooking.about || 'A specialized general medicine practitioner committed to providing premium preventive care, out-patient analytics, and safe local health consulting.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Standard diagnostic fees</span>
                    <span className="text-lg font-black text-teal-600 font-mono">₹{selectedDoctorForBooking.fees} INR</span>
                  </div>
                  <div className="text-right text-xs text-slate-400 font-mono">
                    <p>Address: {selectedDoctorForBooking.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Scheduler Slot Calendar Panel */}
            <form onSubmit={handleConfirmAppointmentBooking} className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-teal-500" />
                Select Appointment Slot & Date
              </h2>

              {/* 1. Date Card list selector */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. Preferred Calendar Date</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {getNext7Days().map((day) => {
                    const isSelected = bookingDate === day.formatted;
                    return (
                      <button
                        type="button"
                        key={day.formatted}
                        onClick={() => setBookingDate(day.formatted)}
                        className={`p-4 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-500/10'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-75">{day.dayName}</p>
                        <p className="text-2xl font-black mt-1">{day.dayNumber}</p>
                        <p className="text-xs font-semibold opacity-85 mt-0.5">{day.month}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Grid of available timeslots */}
              <div className="space-y-3 mt-8">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">2. Standard Hourly Slot</span>
                {selectedDoctorForBooking.availableTimeSlots.length === 0 ? (
                  <p className="text-sm font-semibold text-rose-500">Wait, no available slots left today</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {selectedDoctorForBooking.availableTimeSlots.map((time) => {
                      const isSelected = bookingTime === time;
                      return (
                        <button
                          type="button"
                          key={time}
                          onClick={() => setBookingTime(time)}
                          className={`py-3.5 px-4 rounded-xl border font-bold text-xs font-mono transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                  <p className="text-sm text-slate-500">Selected: <strong className="text-slate-800">{bookingDate}</strong> at <strong className="text-slate-800">{bookingTime}</strong></p>
                  <p className="text-[10px] mt-1 text-slate-400">Cancel standard reservation free of cost up to 24 hours prior.</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-teal-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  {isLoading ? 'Booking your slot...' : 'LOCK SLOT & BOOK APPOINTMENT'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== SCREEN 4: LOGIN / REGISTRATION MODES ==================== */}
        {currentView === 'login' && (
          <div className="max-w-md mx-auto px-4 py-16 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
              
              {/* Form Mode Header Tabs */}
              <div className="text-center space-y-2 mb-6">
                <h1 className="text-2xl font-black text-slate-950">Secure Portal</h1>
                <p className="text-xs text-slate-500">Sign in to coordinate schedules & manage active clinics.</p>
              </div>

              {/* Login Channels Selector */}
              <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl text-[10px] font-bold uppercase tracking-wider mb-8 text-center">
                <button
                  onClick={() => { setAuthMode('patient_login'); setLoginEmail(''); setLoginPassword(''); }}
                  className={`py-2 rounded-lg cursor-pointer ${authMode === 'patient_login' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Patient
                </button>
                <button
                  onClick={() => { setAuthMode('patient_register'); }}
                  className={`py-2 rounded-lg cursor-pointer ${authMode === 'patient_register' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  New Pt.
                </button>
                <button
                  onClick={() => { setAuthMode('doctor_login'); setLoginEmail(''); setLoginPassword(''); }}
                  className={`py-2 rounded-lg cursor-pointer ${authMode === 'doctor_login' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Doctor
                </button>
                <button
                  onClick={() => { setAuthMode('admin_login'); setLoginEmail(''); setLoginPassword(''); }}
                  className={`py-2 rounded-lg cursor-pointer ${authMode === 'admin_login' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Admin
                </button>
              </div>

              {/* Mode indicator */}
              <div className="mb-4">
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  {authMode === 'patient_register' ? 'Create Patient Account' : `${authMode.replace('_', ' ')} Panel`}
                </span>
              </div>

              {/* Quick seed prefill panel (Extremely user friendly!) */}
              <div className="bg-teal-50/50 border border-teal-100 p-3.5 rounded-2xl mb-6 space-y-2">
                <p className="text-[11px] font-bold text-teal-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                  Quick Presentation Logins
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] font-medium pt-1">
                  <button onClick={() => fillCredentials('patient')} className="bg-white border hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md cursor-pointer">
                    Demo Patient
                  </button>
                  <button onClick={() => fillCredentials('doctor')} className="bg-white border hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md cursor-pointer">
                    Demo Doctor
                  </button>
                  <button onClick={() => fillCredentials('admin')} className="bg-white border hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md cursor-pointer">
                    Mock Admin
                  </button>
                </div>
              </div>

              {/* Form body */}
              {authMode === 'patient_register' ? (
                <form onSubmit={handleRegisterPatient} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Pawan Kalyan"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. pavan@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Secure Password *</label>
                    <input 
                      type="password" 
                      required
                      placeholder="Min 6 characters"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Phone</label>
                      <input 
                        type="tel" 
                        placeholder="9019723646" 
                        value={registerPhone} 
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Birth Date</label>
                      <input 
                        type="date" 
                        value={registerDob} 
                        onChange={(e) => setRegisterDob(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Gender</label>
                      <select 
                        value={registerGender}
                        onChange={(e: any) => setRegisterGender(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:bg-white focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Not Selected">Not Selected</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1 font-sans">Location City</label>
                      <input 
                        type="text" 
                        placeholder="JP Nagar, Bangalore" 
                        value={registerAddress}
                        onChange={(e) => setRegisterAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold p-3.5 rounded-xl cursor-pointer shadow-lg shadow-teal-500/10 active:scale-95 transition-all text-sm block mt-6"
                  >
                    {isLoading ? 'Creating credential profile...' : 'Register as Patient'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Registered Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="Enter register email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Portal Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold p-3.5 rounded-xl cursor-pointer shadow-lg shadow-teal-500/10 active:scale-95 transition-all text-sm block mt-6"
                  >
                    {isLoading ? 'Decrypting authorization...' : 'Sign In Now'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ==================== SCREEN 5: PATIENT HEALTH DASHBOARD ==================== */}
        {currentView === 'patient-dashboard' && currentUser && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            <div className="space-y-2 mb-10 text-center sm:text-left">
              <h1 className="text-3xl font-black text-slate-900">Patient Dashboard</h1>
              <p className="text-slate-600 text-sm">Securely manipulate your local health credentials and manage upcoming diagnostic appointment slots.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Profile Config section left */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm self-start">
                <div className="text-center pb-6 border-b border-slate-100 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border overflow-hidden relative group mb-4 shadow-inner">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-3xl">
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{currentUser.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">{currentUser.email}</p>
                    <span className="inline-block mt-3 bg-teal-50 text-teal-700 border border-teal-100 font-semibold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                      Patient profile ID
                    </span>
                  </div>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleUpdatePatientProfile} className="pt-6 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Patient Name</label>
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Avatar Image URL</label>
                      <input 
                        type="text" 
                        value={editAvatar} 
                        onChange={(e) => setEditAvatar(e.target.value)}
                        className="w-full bg-slate-50 border p-2.5 rounded-xl text-[11px] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Phone Connection</label>
                      <input 
                        type="text" 
                        value={editPhone} 
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-semibold focus:bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gender</label>
                        <select 
                          value={editGender}
                          onChange={(e: any) => setEditGender(e.target.value)}
                          className="w-full bg-slate-50 border p-2 text-xs"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Not Selected">Not Selected</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Birthday</label>
                        <input 
                          type="date" 
                          value={editDob} 
                          onChange={(e) => setEditDob(e.target.value)}
                          className="w-full bg-slate-50 border p-2 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Default Clinic Address</label>
                      <textarea 
                        value={editAddress} 
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs"
                        rows={2}
                      />
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button 
                        type="submit" 
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold p-2.5 rounded-xl cursor-pointer text-center"
                      >
                        Save
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold p-2.5 rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="pt-6 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Contact Details</span>
                    
                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-medium">Telephone:</span>
                        <strong className="text-slate-800">{currentUser.phone || '9019723646'}</strong>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-medium">Gender Assigned:</span>
                        <strong className="text-slate-800">{currentUser.gender}</strong>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-medium">Date of Birth:</span>
                        <strong className="text-slate-800 font-mono">{currentUser.dob || '2004-05-26'}</strong>
                      </div>
                      <div className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 font-medium block mb-1">Standard Location:</span>
                        <strong className="text-slate-700 leading-relaxed text-[11px]">{currentUser.address || 'No. 12A/19, 9th Cross, JP Nagar, Bangalore'}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white p-3 border border-slate-800 rounded-xl text-xs font-bold' font-medium hover:bg-teal-600 transition-colors mt-6 cursor-pointer"
                    >
                      EDIT PROFILE DATA
                    </button>
                  </div>
                )}
              </div>

              {/* Active list section right */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-6 border-b border-slate-100 mb-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-teal-600" />
                    My Scheduled Appointments History
                  </h2>
                  <button 
                    onClick={() => setCurrentView('doctors')}
                    className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-4 py-2 border border-teal-150 rounded-lg text-xs cursor-pointer"
                  >
                    + Book New Specialist
                  </button>
                </div>

                {patientAppointments.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <BadgeAlert className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-700">No appointments scheduled</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Simply search through our Bangalore database listings to schedule certified clinical specialists in minutes.
                    </p>
                    <button 
                      onClick={() => setCurrentView('doctors')}
                      className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-4.5 py-2 rounded-lg"
                    >
                      Browse registry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4.5">
                    {patientAppointments.map((appt) => {
                      const isCancelled = appt.status === 'Cancelled';
                      const isComplete = appt.status === 'Paid';
                      return (
                        <div 
                          key={appt.id} 
                          className="border border-slate-200 hover:border-slate-300 rounded-2xl p-5 md:flex items-center justify-between gap-6 transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-50 border overflow-hidden shrink-0 hidden sm:block">
                              {appt.doctorImage ? (
                                <img src={appt.doctorImage} alt={appt.doctorName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-teal-300">
                                  <Stethoscope className="w-8 h-8" />
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-slate-900 text-sm">{appt.doctorName}</h3>
                                <span className="text-[10px] text-teal-600 bg-teal-50 border border-teal-150 px-2 py-0.5 rounded-full font-medium">
                                  {appt.doctorSpeciality}
                                </span>
                              </div>
                              <p className="text-slate-500 text-xs flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-bold underline text-slate-700">{appt.date}</span> at <span className="font-bold underline text-slate-750">{appt.time}</span>
                              </p>
                              <p className="text-[10px] text-slate-400">Reserved diagnostic fees: ₹{appt.fees} INR</p>
                            </div>
                          </div>

                          <div className="mt-4 md:mt-0 flex sm:items-center gap-4 shrink-0 justify-between">
                            {/* status pill */}
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isCancelled 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : isComplete 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-teal-50 text-teal-700 border border-teal-200'
                            }`}>
                              {appt.status}
                            </span>

                            {!isCancelled && !isComplete && (
                              <button
                                onClick={() => handleCancelPatientAppointment(appt.id)}
                                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Cancel Slot
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 6: DOCTOR WORKSPACE INTERFACE ==================== */}
        {currentView === 'doctor-dashboard' && currentDoctor && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            <div className="space-y-2 mb-10 text-center sm:text-left">
              <h1 className="text-3xl font-black text-slate-900">Doctor Workspace Portal</h1>
              <p className="text-slate-600 text-sm">Review incoming patient schedules, set clinical availability, and manage your public clinic listing.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Profile Config section left */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm self-start">
                <div className="text-center pb-6 border-b border-slate-100 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-slate-50 border overflow-hidden relative mb-4">
                    {currentDoctor.image ? (
                      <img src={currentDoctor.image} alt={currentDoctor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-3xl">
                        D
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{currentDoctor.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">{currentDoctor.email}</p>
                    
                    {/* Live toggler switch */}
                    <button 
                      onClick={toggleDocAvailability}
                      className={`inline-flex items-center gap-1.5 mt-4 border px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        editDocAvailable 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                          : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${editDocAvailable ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
                      {editDocAvailable ? 'ACCEPTING APPOINTMENTS' : 'OFF DUTY'}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleUpdateDoctorProfile} className="pt-6 space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Clinical Credentials</span>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Clinic Specialization</label>
                    <select 
                      value={editDocSpeciality}
                      onChange={(e: any) => setEditDocSpeciality(e.target.value)}
                      className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                    >
                      <option value="General physician">General physician</option>
                      <option value="Gynecologist">Gynecologist</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Gastroenterologist">Gastroenterologist</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Assigned Degree</label>
                      <input 
                        type="text" 
                        required
                        value={editDocDegree} 
                        onChange={(e) => setEditDocDegree(e.target.value)}
                        className="w-full bg-slate-50 border p-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Clinical Exp</label>
                      <input 
                        type="text" 
                        required
                        value={editDocExperience} 
                        onChange={(e) => setEditDocExperience(e.target.value)}
                        className="w-full bg-slate-50 border p-2 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Session Fees (INR)</label>
                    <input 
                      type="number" 
                      required
                      value={editDocFees} 
                      onChange={(e) => setEditDocFees(Number(e.target.value))}
                      className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Practice Bio</label>
                    <textarea 
                      value={editDocAbout} 
                      onChange={(e) => setEditDocAbout(e.target.value)}
                      className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hospital Clinic Address</label>
                    <input 
                      type="text" 
                      required
                      value={editDocAddress} 
                      onChange={(e) => setEditDocAddress(e.target.value)}
                      className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-slate-900 hover:bg-teal-600 text-white font-bold py-3.5 px-4 rounded-xl text-xs cursor-pointer block transition-colors"
                  >
                    {isLoading ? 'Updating Clinic Registry...' : 'SAVE WORKSPACE CONFIG'}
                  </button>
                </form>
              </div>

              {/* Active list section right */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center pb-6 border-b border-slate-100 mb-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-teal-600" />
                    Incoming Patients & Session Bookings
                  </h2>
                  <button 
                    onClick={fetchDoctorAppointments}
                    className="text-xs text-teal-600 hover:underline font-bold"
                  >
                    Reload Schedule List
                  </button>
                </div>

                {doctorAppointments.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 border rounded-2xl border-dashed">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-base font-bold text-slate-700">No Patient Appointments Scheduled</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Patients in Bengaluru can find you on the home dashboard directory when your status is 'Accepting Appointments'.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doctorAppointments.map((appt) => {
                      const isCancelled = appt.status === 'Cancelled';
                      const isComplete = appt.status === 'Paid';
                      
                      // Calculate client age
                      const calculateAge = (dob: string) => {
                        if (!dob) return '22';
                        const today = new Date();
                        const birthDate = new Date(dob);
                        let age = today.getFullYear() - birthDate.getFullYear();
                        return age.toString();
                      };

                      return (
                        <div 
                          key={appt.id} 
                          className="border rounded-2xl p-5 border-slate-200 hover:border-slate-300 transition-all space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="bg-slate-100 border text-slate-700 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase font-mono">ID: {appt.id}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest ${
                                  isCancelled 
                                    ? 'bg-rose-50 text-rose-605' 
                                    : isComplete 
                                      ? 'bg-emerald-50 text-emerald-700' 
                                      : 'bg-teal-50 text-teal-700'
                                }`}>
                                  {appt.status}
                                </span>
                              </div>
                              <h3 className="font-extrabold text-slate-900 text-base mt-1.5">Patient: {appt.userName}</h3>
                              <p className="text-xs text-slate-500 font-mono">{appt.userEmail} | Phone: {appt.userPhone}</p>
                            </div>

                            <div className="text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium sm:text-right shrink-0">
                              <p className="text-slate-400 text-[10px] uppercase block tracking-wider">Date & Time reserved</p>
                              <p className="text-slate-900 mt-0.5"><strong className="underline text-teal-700">{appt.date}</strong> at <strong className="underline">{appt.time}</strong></p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100/55">
                            <span className="bg-slate-100 px-2.5 py-1 rounded">Gender: {appt.userGender}</span>
                            <span className="bg-slate-100 px-2.5 py-1 rounded">Calculated Age: {calculateAge(appt.userDob)} Years</span>
                            <span className="bg-slate-100 px-2.5 py-1 rounded">Settled: ₹{appt.fees} INR</span>
                          </div>

                          {!isCancelled && !isComplete && (
                            <div className="flex sm:justify-end gap-3 pt-2">
                              <button 
                                onClick={() => handleCancelDoctorAppointment(appt.id)}
                                className="inline-flex items-center justify-center gap-1 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 px-3.5 py-2 rounded-lg text-xs font-bold' font-medium transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancel Session
                              </button>
                              <button 
                                onClick={() => handleCompleteDoctorAppointment(appt.id)}
                                className="inline-flex items-center justify-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-bold' font-semibold hover:shadow-md transition-colors cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Mark Completed
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 7: ADMIN CONTROL PANEL ==================== */}
        {currentView === 'admin-dashboard' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            <div className="space-y-2 mb-10 text-center sm:text-left">
              <h1 className="text-3xl font-black text-slate-900">Admin Control Panel</h1>
              <p className="text-slate-600 text-sm">Oversee healthcare providers, check clinical stats, monitor and cancel patient booking histories.</p>
            </div>

            {/* KPI Statistics counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white border border-slate-250 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block uppercase">Total Specialists</span>
                  <p className="text-3xl font-black text-slate-950 font-mono">{adminDashboardStats?.doctors || doctorsList.length}</p>
                </div>
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                  <Stethoscope className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-250 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block uppercase font-sans">Appointments Booked</span>
                  <p className="text-3xl font-black text-slate-950 font-mono">{adminDashboardStats?.appointments || adminAppointments.length}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-250 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block uppercase">Registered Patients</span>
                  <p className="text-3xl font-black text-slate-950 font-mono">{adminDashboardStats?.patients || 1}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Add New Doctor Specialty Form left */}
              <div className="lg:col-span-5 bg-white border border-slate-205 rounded-3xl p-6 shadow-sm self-start">
                <div className="pb-4 border-b mb-6 border-slate-100">
                  <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-teal-500" />
                    Register New Clinical Expert
                  </h2>
                </div>

                <form onSubmit={handleAddDoctor} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Expert's Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Dr. Emily Larson" 
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="w-full bg-slate-50 border p-3 rounded-xl text-xs font-semibold focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Doctor Email *</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="emily@yuvacare.com" 
                        value={newDocEmail}
                        onChange={(e) => setNewDocEmail(e.target.value)}
                        className="w-full bg-slate-50 border p-3 rounded-xl text-xs focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Registry Password *</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="••••••••" 
                        value={newDocPassword}
                        onChange={(e) => setNewDocPassword(e.target.value)}
                        className="w-full bg-slate-50 border p-3 rounded-xl text-xs focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Speciality Area</label>
                      <select 
                        value={newDocSpeciality}
                        onChange={(e: any) => setNewDocSpeciality(e.target.value)}
                        className="w-full bg-slate-50 border p-2.5 text-xs font-semibold focus:bg-white"
                      >
                        <option value="General physician">General physician</option>
                        <option value="Gynecologist">Gynecologist</option>
                        <option value="Dermatologist">Dermatologist</option>
                        <option value="Pediatrician">Pediatrician</option>
                        <option value="Neurologist">Neurologist</option>
                        <option value="Gastroenterologist">Gastroenterologist</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 font-sans">Consultation Fees *</label>
                      <input 
                        type="number" 
                        required 
                        value={newDocFees}
                        onChange={(e) => setNewDocFees(Number(e.target.value))}
                        className="w-full bg-slate-50 border p-3 rounded-xl text-xs focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 font-sans">Degree Code</label>
                      <input 
                        type="text" 
                        placeholder="MBBS" 
                        value={newDocDegree}
                        onChange={(e) => setNewDocDegree(e.target.value)}
                        className="w-full bg-slate-50 border p-3 rounded-xl text-xs focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Experience Years</label>
                      <input 
                        type="text" 
                        placeholder="3 Years" 
                        value={newDocExperience}
                        onChange={(e) => setNewDocExperience(e.target.value)}
                        className="w-full bg-slate-50 border p-3 rounded-xl text-xs focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Expert Profile Photo URL</label>
                    <input 
                      type="text" 
                      placeholder="Optional layout picture URL" 
                      value={newDocImage}
                      onChange={(e) => setNewDocImage(e.target.value)}
                      className="w-full bg-slate-50 border p-3 rounded-xl text-[11px] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Clinical Bio Description</label>
                    <textarea 
                      placeholder="Specialization expertise overview..." 
                      value={newDocAbout}
                      onChange={(e) => setNewDocAbout(e.target.value)}
                      className="w-full bg-slate-50 border p-3 rounded-xl text-xs focus:bg-white"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 font-sans">Hospital Address Location *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Clinics building name" 
                      value={newDocAddress}
                      onChange={(e) => setNewDocAddress(e.target.value)}
                      className="w-full bg-slate-50 border p-3 rounded-xl text-xs focus:bg-white"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold p-3.5 rounded-xl text-xs cursor-pointer block transition-colors mt-6 shadow-md"
                  >
                    {isLoading ? 'Creating Physician Record...' : 'ADD PHYSICIAN TO CLINIC RECORD'}
                  </button>
                </form>
              </div>

              {/* Monitor components right */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* Total doctors database list */}
                <div className="bg-white border rounded-3xl p-6 shadow-sm">
                  <div className="pb-4 border-b border-slate-100 mb-6 font-bold text-slate-900">
                    <h3>Active Physicians Availability Switches</h3>
                  </div>

                  <div className="divide-y divide-slate-105 space-y-4">
                    {doctorsList.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-50 border overflow-hidden shrink-0">
                            {doc.image && <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                            <p className="text-[10px] text-teal-600">{doc.speciality}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${doc.available ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {doc.available ? 'Listed' : 'Sidelined'}
                          </span>
                          <button
                            onClick={() => handleAdminToggleDocAvailability(doc.id)}
                            className="bg-slate-100 border hover:bg-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold"
                          >
                            Toggle availability
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full medical slots audit */}
                <div className="bg-white border rounded-3xl p-6 shadow-sm">
                  <div className="pb-4 border-b border-slate-100 mb-6 font-bold text-slate-900">
                    <h3>Global Scheduled Clinical Bookings ({adminAppointments.length})</h3>
                  </div>

                  {adminAppointments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-xs font-medium">All database files empty of reservation slots</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 pr-2">
                      {adminAppointments.map((appt) => (
                        <div key={appt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-xs">{appt.userName}</span>
                              <span className="text-[10px] text-slate-400">&rarr;</span>
                              <span className="font-bold text-teal-700 text-xs">{appt.doctorName}</span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-400">Time: {appt.date} at {appt.time} | Fees: ₹{appt.fees}</p>
                            <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 rounded ${
                              appt.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' : appt.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-teal-50 text-teal-700'
                            }`}>{appt.status}</span>
                          </div>

                          {appt.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleAdminCancelAppointment(appt.id)}
                              className="text-rose-600 hover:text-rose-800 text-[10px] font-bold shrink-0 self-start sm:self-center"
                            >
                              Revoke booking
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 8: ABOUT CLINIC ==================== */}
        {currentView === 'about' && (
          <div className="max-w-4xl mx-auto px-4 py-16 space-y-12 animate-fade-in text-justify">
            <div className="space-y-2 text-center pb-6 border-b">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">About Yuvacare Online Healthcare</h1>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">VI Semester BCA Project Noble College Bengaluru</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-950">Empowering Health Dynamics</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  In modern healthcare, patients deserve lightning-fast coordination without physical queuing bottlenecks. This custom Online Appointment Booking platform bridges clinical experts and patients across Bangalore seamlessly.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Built natively on the MERN architectural standard, the app supports robust, conflict-free scheduling and role-balanced dashboard controls for general users, certified doctors, and administrator monitors.
                </p>
              </div>

              <div className="bg-teal-50/50 border border-teal-100 rounded-3xl p-6.5 space-y-4 shadow-sm">
                <span className="text-xs font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Academic Project Details
                </span>
                <div className="text-xs space-y-2 pt-2">
                  <p className="text-slate-500">Submitted in partial fulfillment of Bengaluru City University award rules:</p>
                  <p className="font-bold text-slate-800">Noble College Dept. of Computer Science</p>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 mt-2 text-slate-600">
                    <p className="font-bold text-slate-800 mb-1">Creative Team Members:</p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li>A Pawan Kalyan (U18FE23S0005)</li>
                      <li>B Prasanna Kumar Yadav (U18FE23S0006)</li>
                      <li>Mohammed Ibrahim (U18FE23S0039)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t space-y-4 text-center">
              <h3 className="text-xl font-bold text-slate-950">Clinic Vision Statement</h3>
              <p className="text-sm text-slate-600 italic max-w-xl mx-auto">
                "To optimize appointment accessibility across regional demographics, removing double-bookings, ensuring secure personal records databases, and guaranteeing reliable healthcare coordination."
              </p>
            </div>
          </div>
        )}

        {/* ==================== SCREEN 9: CONTACT US ==================== */}
        {currentView === 'contact' && (
          <div className="max-w-4xl mx-auto px-4 py-16 animate-fade-in">
            <div className="space-y-2 text-center mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Contact Us</h1>
              <p className="text-slate-600 max-w-md mx-auto">Have questions or want to register as a healthcare partner? Reach out to our Bengaluru central clinic.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact numbers */}
              <div className="bg-white border rounded-3xl p-8 space-y-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-950">Our Chief Office</h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3.5">
                    <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Clinic Location</p>
                      <p className="text-slate-600 text-xs mt-1">#12A/19, 9th Cross, Opposite Rajshekar Hospital,<br />JP Nagar 1st Phase, Bangalore-78, India</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 pt-4 border-t border-slate-105">
                    <Phone className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">Expert Hotline</p>
                      <p className="text-slate-600 text-xs mt-1 font-mono">+91 90197 23646</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 pt-4 border-t border-slate-105">
                    <Mail className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">Secure E-Mail Channel</p>
                      <p className="text-slate-600 text-xs mt-1 font-mono">balayuvarajyadav@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiry form */}
              <div className="bg-white border rounded-3xl p-8 space-y-4 shadow-sm">
                <h3 className="text-xl font-bold text-slate-950">Instant Message</h3>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title / Name</label>
                  <input type="text" placeholder="Your Name" className="w-full bg-slate-50 border p-3 rounded-xl text-xs focus:bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description / Inquiry</label>
                  <textarea placeholder="Write message to administrator..." className="w-full bg-slate-50 border p-3 rounded-xl text-xs focus:bg-white" rows={3}></textarea>
                </div>
                <button 
                  onClick={() => showToast('Thank you! Inquiry forwarded successfully.')}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold p-3 rounded-xl text-xs cursor-pointer block transition-colors"
                >
                  SEND ENQUIRY MAIL
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 4. Footer */}
      <footer id="yuvacare-footer" className="bg-slate-900 text-slate-400 py-12 mt-16 border-t border-slate-800 text-justify">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 text-sm">
          
          <div className="md:col-span-5 space-y-4">
            <span className="text-lg font-black text-white flex items-center gap-1.5">
              Yuvacare Health System
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yuvacare online appointment scheduling bridges patient and medical consultants seamlessly in real-time. Created on a TypeScript Node Stack with support for both local file-based database adapters and structured PostgreSQL engines.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Noble College Bengalore VII semester clinical portal project.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Medical Departments</h4>
            <ul className="space-y-1 text-xs">
              <li>General Diagnostic Consultation</li>
              <li>Gynecological Care</li>
              <li>Pediatrics & Immunisation</li>
              <li>Sleek Dermatology Treatments</li>
              <li>Clinical Neuromuscular Diagnosis</li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">University Evaluation Statement</h4>
            <div className="text-xs space-y-2 leading-relaxed text-slate-400 bg-slate-800/50 p-4 rounded-xl border border-slate-800 shadow-sm">
              <p>Submitted for the degree of <strong>Bachelor of Computer Applications</strong> at <strong>Bengaluru City University</strong> for academic year 2025-2026.</p>
              <p className="text-[10px] text-teal-400/80 font-mono mt-2">Professors Guide: Mr. Y. Sai Teja</p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 Yuvacare Online Health Systems. Pure relational & file-based schema architecture.</p>
          <div className="flex gap-4 font-mono text-[10px]">
            <span>U18FE23S0005</span>
            <span>U18FE23S0006</span>
            <span>U18FE23S0039</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
