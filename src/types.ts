export type UserRole = 'patient' | 'doctor' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Not Selected';
  dob: string; // YYYY-MM-DD
  address: string;
  avatar?: string;
  role: 'patient';
}

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  speciality: 'General physician' | 'Gynecologist' | 'Dermatologist' | 'Pediatrician' | 'Neurologist' | 'Gastroenterologist';
  degree: string; // MBBS, MD, etc.
  experience: string; // "3 Years", etc.
  about: string;
  fees: number;
  address: string; // JSON address
  available: boolean;
  image?: string;
  role: 'doctor';
  availableTimeSlots: string[]; // e.g. ["09:00 AM", "10:30 AM", ...]
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userGender: 'Male' | 'Female' | 'Not Selected';
  userDob: string;
  doctorId: string;
  doctorName: string;
  doctorSpeciality: string;
  doctorImage: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "01:30 PM"
  fees: number;
  status: 'Confirmed' | 'Paid' | 'Cancelled';
  createdAt: string;
}

export interface DashboardStats {
  doctorsCount: number;
  appointmentsCount: number;
  patientsCount: number;
  latestBookings: Appointment[];
}
