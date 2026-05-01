import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole, AuthToken } from '../types';

const router = Router();

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return secret || 'dev-secret-do-not-use-in-production';
};

// Mock users for development - password is bcrypt hashed
// admin123 -> $2b$10$... (in real app, use proper hashing)
const mockUsers: Array<User & { password: string }> = [
  {
    id: 'user-001',
    email: 'admin@openvision.ai',
    name: 'Admin User',
    orgId: 'org-001',
    role: UserRole.ADMIN,
    password: '$2b$10$XVJxaFGaFXGCLCLwWwYOpu' // admin123
  },
  {
    id: 'user-002',
    email: 'operator@openvision.ai',
    name: 'Operator User',
    orgId: 'org-001',
    role: UserRole.OPERATOR,
    password: '$2b$10$Yq7v5YRLCLCLwWwYOpuFGa' // operator123
  }
];

// Simple bcrypt comparison for mock (in production, use bcrypt.compare)
const comparePassword = (input: string, hash: string): boolean => {
  // For demo purposes, accept plaintext passwords in dev mode
  if (process.env.NODE_ENV !== 'production') {
    if (input === 'admin123' && hash.startsWith('$2b$')) return true;
    if (input === 'operator123' && hash.startsWith('$2b$')) return true;
  }
  // In production, would use: return bcrypt.compareSync(input, hash);
  return input === hash;
};

// Mock sessions store (in production, use Redis or similar)
const activeSessions: Map<string, { userId: string; expiresAt: number }> = new Map();

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        data: null
      });
    }

    // Mock authentication
    const user = mockUsers.find((u) => u.email === email && comparePassword(password, u.password));

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        data: null
      });
    }

    const token: AuthToken = {
      token: jwt.sign(
        { userId: user.id, email: user.email, role: user.role, orgId: user.orgId },
        getJwtSecret(),
        { algorithm: 'HS256', expiresIn: '24h' }
      ),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user
    };

    activeSessions.set(token.token, { userId: user.id, expiresAt: new Date(token.expiresAt).getTime() });

    return res.json({
      success: true,
      data: token,
      error: null
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      data: null
    });
  }
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, orgId, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        data: null
      });
    }

    // Check if user exists
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        data: null
      });
    }

    // Create mock user - always assign OPERATOR role, never trust client
    const newUser: User & { password: string } = {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      orgId: orgId || 'org-001',
      role: UserRole.OPERATOR, // Always default, ignore client-provided role
      password: password
    };

    mockUsers.push(newUser);

    const message = !process.env.AUTO_CONFIRM_USERS
      ? 'User registered successfully. Please check your email for verification code.'
      : 'User registered and confirmed.';

    return res.json({
      success: true,
      data: {
        message,
        email
      },
      error: null
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      data: null
    });
  }
});

// POST /auth/logout
router.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    activeSessions.delete(authHeader.replace('Bearer ', ''));
  }

  return res.json({
    success: true,
    data: { message: 'Logged out successfully' },
    error: null
  });
});

// GET /auth/me
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      data: null
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      data: null
    });
  }

  const user = mockUsers.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
      data: null
    });
  }

  return res.json({
    success: true,
    data: { user },
    error: null
  });
});

export default router;
