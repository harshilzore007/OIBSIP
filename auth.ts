import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { sendVerificationEmail, sendPasswordResetEmail } from '../mail';
import type { User } from '../../src/types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pizza_craft_super_secret_jwt_key_2026';

function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.users.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // 6-digit verification code or token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'user', // strictly normal user (admin cannot be registered via public endpoint)
      isVerified: false,
      phone: phone || '',
      address: address || '',
      createdAt: new Date().toISOString(),
    };

    db.users.create({
      ...newUser,
      passwordHash,
      verificationToken,
    });

    // Send verification email
    await sendVerificationEmail(newUser.email, verificationToken, newUser.name);

    res.status(201).json({
      message: 'Registration successful! A verification code has been sent to your email.',
      email: newUser.email,
      verificationToken, // Provided to allow instant testing in preview sandbox
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification code or token is required.' });
    }

    let user = db.users.findByVerificationToken(token.trim());
    if (!user && email) {
      const u = db.users.findByEmail(email);
      if (u && u.verificationToken === token.trim()) {
        user = u;
      }
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    const updated = db.users.update(user.id, {
      isVerified: true,
      verificationToken: undefined,
    });

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update user status.' });
    }

    const safeUser: User = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isVerified: updated.isVerified,
      phone: updated.phone,
      address: updated.address,
      createdAt: updated.createdAt,
    };

    const authToken = generateToken(safeUser);

    res.json({
      message: 'Email successfully verified! You are now logged in.',
      token: authToken,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// Resend Verification Email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = db.users.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Account is already verified. You can log in.' });
    }

    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    db.users.update(user.id, { verificationToken });

    await sendVerificationEmail(user.email, verificationToken, user.name);

    res.json({
      message: 'Verification code re-sent to your email.',
      verificationToken,
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Your email has not been verified yet. Please check your inbox or click resend.',
        email: user.email,
      });
    }

    const safeUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
    };

    const token = generateToken(safeUser);

    res.json({
      message: 'Logged in successfully.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// Dedicated Separate Admin Login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Admin email and master password required.' });
    }

    const user = db.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'Access denied. This portal is strictly for authorized restaurant administrators.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    const safeUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'admin',
      isVerified: true,
      phone: user.phone,
      createdAt: user.createdAt,
    };

    const token = generateToken(safeUser);

    res.json({
      message: 'Admin authorization granted.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin authentication failed.' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = db.users.findByEmail(email);
    if (!user) {
      // Don't leak user existence in production, but confirm message
      return res.json({
        message: 'If an account exists with that email, a password reset link has been dispatched.',
      });
    }

    const resetPasswordToken = `rst-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    db.users.update(user.id, { resetPasswordToken });

    await sendPasswordResetEmail(user.email, resetPasswordToken, user.name);

    res.json({
      message: 'Password reset link sent to your email address.',
      resetToken: resetPasswordToken, // Exposed for test preview convenience
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const user = db.users.findByResetToken(token.trim());
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset link.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    db.users.update(user.id, {
      passwordHash,
      resetPasswordToken: undefined,
    });

    res.json({ message: 'Your password has been successfully updated! You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Get Current User Profile (Auth Guard)
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.users.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const safeUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
    };

    res.json({ user: safeUser });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
});

export default router;
