import express from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, hashPassword } from './server/db.js';
import { Appointment, DoctorProfile, UserProfile } from './src/types.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000; // Only port 3000 is accessible externally in AI Studio container

// Parse JSON bodies
app.use(express.json());
// Enable CORS
app.use(cors());

// Configure secrets and defaults
const JWT_SECRET = process.env.JWT_SECRET || 'greatstack';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'yuva@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yuva@123';

// Middleware for patient authentication
const authPatient = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers.token as string;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Access denied: patients only' });
    }
    (req as any).userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Middleware for doctor authentication
const authDoctor = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers.dtoken as string;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access denied: doctors only' });
    }
    (req as any).doctorId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Middleware for admin authentication
const authAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.headers.atoken as string;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role: string };
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: admin only' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// --- API ENDPOINTS ---

// PUBLIC endpoints
app.get('/api/doctor/list', async (req, res) => {
  try {
    const doctors = await db.getDoctors();
    const publicList = doctors.map(({ passwordHash, ...doc }) => doc);
    res.json({ success: true, doctors: publicList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 1. Patient / User APIs
app.post('/api/user/register', async (req, res) => {
  try {
    const { name, email, password, phone, dob, gender, address } = req.body;
    if (!name || !email || !password) {
      return res.json({ success: false, message: 'Missing required signup parameters' });
    }

    const users = await db.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.json({ success: false, message: 'Email already registered' });
    }

    const userPasswordHash = hashPassword(password);
    const userId = `user-${Date.now()}`;
    const newUser: UserProfile & { passwordHash: string } = {
      id: userId,
      name,
      email,
      phone: phone || '',
      gender: gender || 'Not Selected',
      dob: dob || '',
      address: address || '',
      role: 'patient',
      passwordHash: userPasswordHash
    };

    await db.addUser(newUser);
    const token = jwt.sign({ id: userId, role: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: userId, name, email, role: 'patient' } });
  } catch (error: any) {
    res.status(500).json({ success: true, message: error.message });
  }
});

app.post('/api/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ success: false, message: 'Missing parameters' });
    }

    const users = await db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    const match = hashPassword(password) === user.passwordHash;
    if (!match) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        address: user.address,
        avatar: user.avatar,
        role: 'patient'
      }
    });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/user/profile', authPatient, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    const { passwordHash, ...profile } = user;
    res.json({ success: true, userData: profile });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/user/update-profile', authPatient, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { name, phone, gender, dob, address, avatar } = req.body;
    const updated = await db.updateUser(userId, { name, phone, gender, dob, address, avatar });
    if (!updated) {
      return res.json({ success: false, message: 'User update failed' });
    }
    res.json({ success: true, message: 'Profile updated successfully', userData: updated });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/user/book-appointment', authPatient, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { doctorId, slotDate, slotTime } = req.body; // slotDate format is YYYY-MM-DD

    if (!doctorId || !slotDate || !slotTime) {
      return res.json({ success: false, message: 'Missing booking dates or slots' });
    }

    const doctors = await db.getDoctors();
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) {
      return res.json({ success: false, message: 'Doctor not found' });
    }

    if (!doctor.available) {
      return res.json({ success: false, message: 'Doctor is currently not available' });
    }

    const appointments = await db.getAppointments();
    // Check double-booking
    const exists = appointments.some(appt => appt.doctorId === doctorId && appt.date === slotDate && appt.time === slotTime && appt.status !== 'Cancelled');
    if (exists) {
      return res.json({ success: false, message: 'This slot is already booked' });
    }

    const users = await db.getUsers();
    const user = users.find(u => u.id === userId)!;

    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`,
      userId,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '9019723646',
      userGender: user.gender || 'Male',
      userDob: user.dob || '2004-05-26',
      doctorId,
      doctorName: doctor.name,
      doctorSpeciality: doctor.speciality,
      doctorImage: doctor.image || '',
      date: slotDate,
      time: slotTime,
      fees: doctor.fees,
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    await db.addAppointment(newAppointment);
    res.json({ success: true, message: 'Appointment booked successfully' });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/user/appointments', authPatient, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const appointments = await db.getAppointments();
    const userAppointments = appointments.filter(a => a.userId === userId);
    res.json({ success: true, appointments: userAppointments });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/user/cancel-appointment', authPatient, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { appointmentId } = req.body;
    const appointments = await db.getAppointments();
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt || appt.userId !== userId) {
      return res.json({ success: false, message: 'Appointment not found or unauthorized' });
    }
    await db.updateAppointmentStatus(appointmentId, 'Cancelled');
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

// 2. Doctor APIs
app.post('/api/doctor/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ success: false, message: 'Email and password required' });
    }
    const doctors = await db.getDoctors();
    const doctor = doctors.find(d => d.email.toLowerCase() === email.toLowerCase());
    if (!doctor) {
      return res.json({ success: false, message: 'Doctor record not found' });
    }
    const match = hashPassword(password) === doctor.passwordHash;
    if (!match) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: doctor.id, role: 'doctor' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/doctor/appointments', authDoctor, async (req, res) => {
  try {
    const doctorId = (req as any).doctorId;
    const appointments = await db.getAppointments();
    const docAppts = appointments.filter(a => a.doctorId === doctorId);
    res.json({ success: true, appointments: docAppts });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/doctor/cancel-appointment', authDoctor, async (req, res) => {
  try {
    const doctorId = (req as any).doctorId;
    const { appointmentId } = req.body;
    const appointments = await db.getAppointments();
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt || appt.doctorId !== doctorId) {
      return res.json({ success: false, message: 'Appointment not found' });
    }
    await db.updateAppointmentStatus(appointmentId, 'Cancelled');
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/doctor/complete-appointment', authDoctor, async (req, res) => {
  try {
    const doctorId = (req as any).doctorId;
    const { appointmentId } = req.body;
    const appointments = await db.getAppointments();
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt || appt.doctorId !== doctorId) {
      return res.json({ success: false, message: 'Appointment not found' });
    }
    await db.updateAppointmentStatus(appointmentId, 'Paid');
    res.json({ success: true, message: 'Appointment completed successfully' });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/doctor/change-availability', authDoctor, async (req, res) => {
  try {
    const doctorId = (req as any).doctorId;
    const doctors = await db.getDoctors();
    const doc = doctors.find(d => d.id === doctorId);
    if (!doc) {
      return res.json({ success: false, message: 'Doctor not found' });
    }
    const updated = await db.updateDoctor(doctorId, { available: !doc.available });
    res.json({ success: true, message: 'Availability status changed', available: updated?.available });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/doctor/profile', authDoctor, async (req, res) => {
  try {
    const doctorId = (req as any).doctorId;
    const doctors = await db.getDoctors();
    const doc = doctors.find(d => d.id === doctorId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const { passwordHash, ...profile } = doc;
    res.json({ success: true, profileData: profile });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/doctor/update-profile', authDoctor, async (req, res) => {
  try {
    const doctorId = (req as any).doctorId;
    const { speciality, degree, experience, about, fees, address, available } = req.body;
    const updated = await db.updateDoctor(doctorId, { speciality, degree, experience, about, fees: Number(fees), address, available });
    res.json({ success: true, message: 'Profile updated successfully', profileData: updated });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

// 3. Admin APIs
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/admin/add-doctor', authAdmin, async (req, res) => {
  try {
    const { name, email, password, speciality, degree, experience, about, fees, address, image } = req.body;
    if (!name || !email || !password || !speciality) {
      return res.json({ success: false, message: 'Missing required parameters' });
    }

    const doctors = await db.getDoctors();
    if (doctors.find(d => d.email.toLowerCase() === email.toLowerCase())) {
      return res.json({ success: false, message: 'Doctor email already registered' });
    }

    const docId = `doc-${Date.now()}`;
    const newDoc: DoctorProfile & { passwordHash: string } = {
      id: docId,
      name,
      email,
      speciality,
      degree: degree || '',
      experience: experience || '1 Year',
      about: about || '',
      fees: Number(fees || 50),
      address: address || 'JP Nagar, Bangalore',
      available: true,
      image: image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300',
      role: 'doctor',
      availableTimeSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:00 PM', '03:30 PM', '04:00 PM'],
      passwordHash: hashPassword(password)
    };

    await db.addDoctor(newDoc);
    res.json({ success: true, message: 'Doctor Added' });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/admin/appointments', authAdmin, async (req, res) => {
  try {
    const appointments = await db.getAppointments();
    res.json({ success: true, appointments });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/admin/cancel-appointment', authAdmin, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    await db.updateAppointmentStatus(appointmentId, 'Cancelled');
    res.json({ success: true, message: 'Appointment Cancelled' });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/admin/all-doctors', authAdmin, async (req, res) => {
  try {
    const doctors = await db.getDoctors();
    const sanitised = doctors.map(({ passwordHash, ...doc }) => doc);
    res.json({ success: true, doctors: sanitised });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/admin/change-availability', authAdmin, async (req, res) => {
  try {
    const { docId } = req.body;
    const doctors = await db.getDoctors();
    const doc = doctors.find(d => d.id === docId);
    if (!doc) {
      return res.json({ success: false, message: 'Doctor not found' });
    }
    await db.updateDoctor(docId, { available: !doc.available });
    res.json({ success: true, message: 'Availability status updated successfully' });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/admin/dashboard', authAdmin, async (req, res) => {
  try {
    const doctors = await db.getDoctors();
    const users = await db.getUsers();
    const appointments = await db.getAppointments();

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.slice(0, 5) // latest 5
    };
    res.json({ success: true, dashData });
  } catch (error: any) {
    res.json({ success: false, message: error.message });
  }
});

// --- CLIENT SERVER MOUNTING ---
async function start() {
  // Try connecting or initializing database tables (creates files or schemas)
  await initDatabase();

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      try {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Yuvacare Server running successfully at http://localhost:${PORT}`);
  });
}

start();
