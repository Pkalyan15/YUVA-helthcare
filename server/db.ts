import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { UserProfile, DoctorProfile, Appointment } from '../src/types.js';

const { Pool } = pg;

// Define local file paths for fallback DB
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure fallback db directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Generate secure passwords
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Default initial data for seeding
const DEFAULT_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-emily-larson',
    name: 'Dr. Emily Larson',
    email: 'emily.larson@yuvacare.com',
    speciality: 'Gynecologist',
    degree: 'MBBS, MD - Gynecology',
    experience: '3 Years',
    about: 'Dr. Emily Larson has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 70,
    address: 'JP Nagar, Bangalore, India',
    available: true,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300',
    role: 'doctor',
    availableTimeSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:00 PM', '03:30 PM', '04:00 PM']
  },
  {
    id: 'doc-christopher-lee',
    name: 'Dr. Christopher Lee',
    email: 'christopher.lee@yuvacare.com',
    speciality: 'Pediatrician',
    degree: 'MBBS, MD - Pediatrics',
    experience: '5 Years',
    about: 'Dr. Christopher Lee focuses on comprehensive physical, mental, and social health services for children ranging from birth through young adulthood.',
    fees: 80,
    address: 'Rajshekar Hospital Road, Phase 1 JP Nagar, Bangalore',
    available: true,
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300',
    role: 'doctor',
    availableTimeSlots: ['10:00 AM', '10:30 AM', '11:30 AM', '02:30 PM', '03:00 PM', '04:30 PM']
  },
  {
    id: 'doc-sarah-patel',
    name: 'Dr. Sarah Patel',
    email: 'sarah.patel@yuvacare.com',
    speciality: 'Dermatologist',
    degree: 'MBBS, DDVL - Dermatology',
    experience: '4 Years',
    about: 'Dr. Sarah Patel specializes in aesthetic skin solutions, dermatology consultation, and treatment of allergic skin conditions.',
    fees: 75,
    address: 'Indiranagar, Bangalore, India',
    available: true,
    image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300&h=300',
    role: 'doctor',
    availableTimeSlots: ['09:30 AM', '11:00 AM', '12:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']
  },
  {
    id: 'doc-alex-johnson',
    name: 'Dr. Alex Johnson',
    email: 'alex.johnson@yuvacare.com',
    speciality: 'General physician',
    degree: 'MBBS, MD - General Medicine',
    experience: '7 Years',
    about: 'Dr. Alex Johnson is dedicated to acute primary care, preventative general treatment, and internal health diagnostics.',
    fees: 50,
    address: 'HSR Layout, Bangalore, India',
    available: true,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300',
    role: 'doctor',
    availableTimeSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']
  },
  {
    id: 'doc-chloe-davis',
    name: 'Dr. Chloe Davis',
    email: 'chloe.davis@yuvacare.com',
    speciality: 'Neurologist',
    degree: 'MBBS, DM - Neurology',
    experience: '6 Years',
    about: 'Dr. Chloe Davis provides specialized therapy and surgical consultancy for brain, nerve, and chronic spinal ailments.',
    fees: 110,
    address: 'Koramangala, Bangalore, India',
    available: true,
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=300&h=300',
    role: 'doctor',
    availableTimeSlots: ['11:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:00 PM']
  },
  {
    id: 'doc-ryan-evans',
    name: 'Dr. Ryan Evans',
    email: 'ryan.evans@yuvacare.com',
    speciality: 'Gastroenterologist',
    degree: 'MBBS, MD, DM - Gastroenterology',
    experience: '8 Years',
    about: 'Dr. Ryan Evans specializes in diagnosing, treating and preventing disorders affecting the gastrointestinal tract and digestive system.',
    fees: 95,
    address: 'Whitefield, Bangalore, India',
    available: true,
    image: 'https://images.unsplash.com/photo-1637059824899-a441006a6875?auto=format&fit=crop&q=80&w=300&h=300',
    role: 'doctor',
    availableTimeSlots: ['10:00 AM', '11:00 AM', '01:30 PM', '03:00 PM', '04:30 PM']
  }
];

interface DatabaseSchema {
  users: Array<UserProfile & { passwordHash: string }>;
  doctors: Array<DoctorProfile & { passwordHash: string }>;
  appointments: Appointment[];
}

// Global Postgres connection pool
let pool: pg.Pool | null = null;
const pgUri = process.env.DATABASE_URL || process.env.PG_CONN_STRING;

if (pgUri) {
  try {
    pool = new Pool({
      connectionString: pgUri,
      ssl: pgUri.includes('localhost') || pgUri.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });
    console.log('PostgreSQL connection URI detected.');
  } catch (err) {
    console.error('Failed to parse PostgreSQL URI:', err);
  }
}

// Local JSON Database loading helpers
function loadLocalDB(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const seededDoctors = DEFAULT_DOCTORS.map(doc => ({
      ...doc,
      passwordHash: hashPassword('doctor123')
    }));

    const initialDB: DatabaseSchema = {
      users: [
        {
          id: 'user-demo',
          name: 'Pavan Kalyan',
          email: 'pavan@example.com',
          phone: '9019723646',
          gender: 'Male',
          dob: '2004-05-26',
          address: 'No. 12A/19, 9th Cross, JP Nagar, Bangalore',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300&h=300',
          role: 'patient',
          passwordHash: hashPassword('user123')
        }
      ],
      doctors: seededDoctors,
      appointments: []
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
    return initialDB;
  }

  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error('Error reading JSON DB, recreating seed:', e);
    const seededDoctors = DEFAULT_DOCTORS.map(doc => ({
      ...doc,
      passwordHash: hashPassword('doctor123')
    }));
    const initialDB = { users: [], doctors: seededDoctors, appointments: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
    return initialDB;
  }
}

function saveLocalDB(data: DatabaseSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Initialize database (creates Postgres tables if active)
export async function initDatabase() {
  if (!pool) {
    console.log('Starting with File-based JSON Database storage.');
    // Seed locally if necessary
    loadLocalDB();
    return;
  }

  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL Database engine.');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(30),
        gender VARCHAR(20),
        dob VARCHAR(20),
        address TEXT,
        avatar TEXT,
        role VARCHAR(20) DEFAULT 'patient',
        password_hash TEXT NOT NULL
      )
    `);

    // Doctors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        speciality VARCHAR(100) NOT NULL,
        degree VARCHAR(100),
        experience VARCHAR(50),
        about TEXT,
        fees INT,
        address TEXT,
        available BOOLEAN DEFAULT TRUE,
        image TEXT,
        role VARCHAR(20) DEFAULT 'doctor',
        available_time_slots TEXT,
        password_hash TEXT NOT NULL
      )
    `);

    // Appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        user_email VARCHAR(100) NOT NULL,
        user_phone VARCHAR(30),
        user_gender VARCHAR(20),
        user_dob VARCHAR(20),
        doctor_id VARCHAR(100) NOT NULL,
        doctor_name VARCHAR(100) NOT NULL,
        doctor_speciality VARCHAR(100) NOT NULL,
        doctor_image TEXT,
        date VARCHAR(20) NOT NULL,
        time VARCHAR(20) NOT NULL,
        fees INT NOT NULL,
        status VARCHAR(20) DEFAULT 'Confirmed',
        created_at TEXT NOT NULL
      )
    `);

    // Seed doctors
    const doctorsCount = await client.query('SELECT COUNT(*) FROM doctors');
    if (parseInt(doctorsCount.rows[0].count) === 0) {
      console.log('Seeding initial healthcare providers into PostgreSQL...');
      for (const doc of DEFAULT_DOCTORS) {
        await client.query(`
          INSERT INTO doctors (id, name, email, speciality, degree, experience, about, fees, address, available, image, role, available_time_slots, password_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          doc.id, doc.name, doc.email, doc.speciality, doc.degree, doc.experience, doc.about, doc.fees, doc.address, doc.available, doc.image, doc.role,
          JSON.stringify(doc.availableTimeSlots), hashPassword('doctor123')
        ]);
      }
    }

    // Seed patient user
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCount.rows[0].count) === 0) {
      console.log('Seeding initial demo patient into PostgreSQL...');
      await client.query(`
        INSERT INTO users (id, name, email, phone, gender, dob, address, avatar, role, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        'user-demo', 'Pavan Kalyan', 'pavan@example.com', '9019723646', 'Male', '2004-05-26',
        'No. 12A/19, 9th Cross, JP Nagar, Bangalore',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300&h=300',
        'patient', hashPassword('user123')
      ]);
    }

    client.release();
    console.log('PostgreSQL database schema verification completed successfully.');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL tables. Falling back to File DB:', err);
    pool = null; // deactivate pg mode
  }
}

// Unified Async Database API mapping JSON and SQL
export const db = {
  getUsers: async (): Promise<Array<UserProfile & { passwordHash: string }>> => {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM users');
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone || '',
        gender: (r.gender || 'Not Selected') as any,
        dob: r.dob || '',
        address: r.address || '',
        avatar: r.avatar || '',
        role: 'patient',
        passwordHash: r.password_hash
      }));
    }
    return loadLocalDB().users;
  },

  getDoctors: async (): Promise<Array<DoctorProfile & { passwordHash: string }>> => {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM doctors');
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        speciality: r.speciality as any,
        degree: r.degree || '',
        experience: r.experience || '',
        about: r.about || '',
        fees: Number(r.fees || 0),
        address: r.address || '',
        available: Boolean(r.available),
        image: r.image || '',
        role: 'doctor',
        availableTimeSlots: JSON.parse(r.available_time_slots || '[]'),
        passwordHash: r.password_hash
      }));
    }
    return loadLocalDB().doctors;
  },

  getAppointments: async (): Promise<Appointment[]> => {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM appointments ORDER BY created_at DESC');
      return rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        userPhone: r.user_phone || '',
        userGender: (r.user_gender || 'Not Selected') as any,
        userDob: r.user_dob || '',
        doctorId: r.doctor_id,
        doctorName: r.doctor_name,
        doctorSpeciality: r.doctor_speciality,
        doctorImage: r.doctor_image || '',
        date: r.date,
        time: r.time,
        fees: Number(r.fees || 0),
        status: r.status as any,
        createdAt: r.created_at
      }));
    }
    return loadLocalDB().appointments;
  },

  addUser: async (user: UserProfile & { passwordHash: string }) => {
    if (pool) {
      await pool.query(`
        INSERT INTO users (id, name, email, phone, gender, dob, address, avatar, role, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [user.id, user.name, user.email, user.phone, user.gender, user.dob, user.address, user.avatar || '', user.role, user.passwordHash]);
      return;
    }
    const local = loadLocalDB();
    local.users.push(user);
    saveLocalDB(local);
  },

  updateUser: async (userId: string, updates: Partial<UserProfile>) => {
    if (pool) {
      const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'role');
      if (keys.length === 0) return null;

      const setClause = keys.map((k, i) => `${k === 'passwordHash' ? 'password_hash' : k} = $${i + 2}`).join(', ');
      const values = keys.map(k => (updates as any)[k]);

      await pool.query(`
        UPDATE users SET ${setClause} WHERE id = $1
      `, [userId, ...values]);

      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone || '',
        gender: r.gender as any,
        dob: r.dob || '',
        address: r.address || '',
        avatar: r.avatar || '',
        role: 'patient'
      } as UserProfile;
    }

    const local = loadLocalDB();
    const index = local.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      local.users[index] = { ...local.users[index], ...updates };
      saveLocalDB(local);
      return local.users[index];
    }
    return null;
  },

  addDoctor: async (doctor: DoctorProfile & { passwordHash: string }) => {
    if (pool) {
      await pool.query(`
        INSERT INTO doctors (id, name, email, speciality, degree, experience, about, fees, address, available, image, role, available_time_slots, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        doctor.id, doctor.name, doctor.email, doctor.speciality, doctor.degree, doctor.experience, doctor.about, doctor.fees, doctor.address,
        doctor.available, doctor.image || '', doctor.role, JSON.stringify(doctor.availableTimeSlots), doctor.passwordHash
      ]);
      return;
    }
    const local = loadLocalDB();
    local.doctors.push(doctor);
    saveLocalDB(local);
  },

  updateDoctor: async (doctorId: string, updates: Partial<DoctorProfile>) => {
    if (pool) {
      const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'role');
      if (keys.length === 0) return null;

      const setClause = keys.map((k, i) => {
        if (k === 'availableTimeSlots') return `available_time_slots = $${i + 2}`;
        return `${k} = $${i + 2}`;
      }).join(', ');

      const values = keys.map(k => {
        if (k === 'availableTimeSlots') return JSON.stringify(updates[k]);
        return (updates as any)[k];
      });

      await pool.query(`
        UPDATE doctors SET ${setClause} WHERE id = $1
      `, [doctorId, ...values]);

      const { rows } = await pool.query('SELECT * FROM doctors WHERE id = $1', [doctorId]);
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        speciality: r.speciality as any,
        degree: r.degree,
        experience: r.experience,
        about: r.about,
        fees: Number(r.fees),
        address: r.address,
        available: Boolean(r.available),
        image: r.image,
        role: 'doctor',
        availableTimeSlots: JSON.parse(r.available_time_slots || '[]')
      } as DoctorProfile;
    }

    const local = loadLocalDB();
    const index = local.doctors.findIndex(d => d.id === doctorId);
    if (index !== -1) {
      local.doctors[index] = { ...local.doctors[index], ...updates };
      saveLocalDB(local);
      return local.doctors[index];
    }
    return null;
  },

  addAppointment: async (appointment: Appointment) => {
    if (pool) {
      await pool.query(`
        INSERT INTO appointments (id, user_id, user_name, user_email, user_phone, user_gender, user_dob, doctor_id, doctor_name, doctor_speciality, doctor_image, date, time, fees, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        appointment.id, appointment.userId, appointment.userName, appointment.userEmail, appointment.userPhone, appointment.userGender, appointment.userDob,
        appointment.doctorId, appointment.doctorName, appointment.doctorSpeciality, appointment.doctorImage || '', appointment.date, appointment.time,
        appointment.fees, appointment.status, appointment.createdAt
      ]);
      return;
    }
    const local = loadLocalDB();
    local.appointments.push(appointment);
    saveLocalDB(local);
  },

  updateAppointmentStatus: async (appointmentId: string, status: 'Confirmed' | 'Paid' | 'Cancelled') => {
    if (pool) {
      await pool.query('UPDATE appointments SET status = $2 WHERE id = $1', [appointmentId, status]);
      const { rows } = await pool.query('SELECT * FROM appointments WHERE id = $1', [appointmentId]);
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        userPhone: r.user_phone || '',
        userGender: r.user_gender as any,
        userDob: r.user_dob || '',
        doctorId: r.doctor_id,
        doctorName: r.doctor_name,
        doctorSpeciality: r.doctor_speciality,
        doctorImage: r.doctor_image || '',
        date: r.date,
        time: r.time,
        fees: Number(r.fees),
        status: r.status as any,
        createdAt: r.created_at
      } as Appointment;
    }

    const local = loadLocalDB();
    const index = local.appointments.findIndex(a => a.id === appointmentId);
    if (index !== -1) {
      local.appointments[index].status = status;
      saveLocalDB(local);
      return local.appointments[index];
    }
    return null;
  }
};
