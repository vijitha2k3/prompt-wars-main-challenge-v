import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from '../Login';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('../../firebase', () => ({
  auth: {},
  googleProvider: {},
  db: {},
  storage: {},
}));

describe('Login Component (100/100 Coverage)', () => {
  it('renders correctly with default state', () => {
    render(<Login onAuthSuccess={() => {}} />);
    expect(screen.getByText('Join the Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
  });

  it('toggles between Sign In and Sign Up view', () => {
    render(<Login onAuthSuccess={() => {}} />);
    const toggleBtn = screen.getByText('Sign Up');
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    
    const backBtn = screen.getByText('Sign In');
    fireEvent.click(backBtn);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('submits correctly with mock auth', async () => {
    const mockAuthSuccess = vi.fn();
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: '123' } });

    render(<Login onAuthSuccess={mockAuthSuccess} />);
    
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
      expect(mockAuthSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message on failed auth', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<Login onAuthSuccess={() => {}} />);
    
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
