import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { register } = useAuth();
  const navigate = useNavigate();

  // Validation helpers
  const validateUsername = (username: string) => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 50) return 'Username must be less than 50 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  // Password strength checks
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[@$!%*?&]/.test(formData.password)
  };

  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);

  // Validate on change
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (touched.username) {
      const usernameError = validateUsername(formData.username);
      if (usernameError) newErrors.username = usernameError;
    }

    if (touched.email) {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
    }

    if (touched.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
    }

    if (touched.confirmPassword && formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (touched.firstName && !formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (touched.lastName && !formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
  }, [formData, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    const { firstName, lastName, username, email, password, confirmPassword } = formData;

    // Validate all fields
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (usernameError || emailError || passwordError) {
      toast.error('Please fix the validation errors');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your first and last name');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!allPasswordChecksPassed) {
      toast.error('Password does not meet all requirements');
      return;
    }

    setLoading(true);
    try {
      await register({ firstName, lastName, username, email, password });
      toast.success('Account created! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      // Try to extract specific error message
      const message = error.response?.data?.error?.message ||
                      error.response?.data?.errors?.[0]?.msg ||
                      error.message ||
                      'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const PasswordCheck = ({ passed, text }: { passed: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${passed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
      {passed ? (
        <CheckCircleIcon className="w-4 h-4" />
      ) : (
        <XCircleIcon className="w-4 h-4" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Create Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="John"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 ${
                errors.firstName && touched.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.firstName && touched.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Doe"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 ${
                errors.lastName && touched.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.lastName && touched.lastName && (
              <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="johndoe123"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 ${
              errors.username && touched.username ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Letters, numbers, and underscores only. 3-50 characters.
          </p>
          {errors.username && touched.username && (
            <p className="mt-1 text-sm text-red-500">{errors.username}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="you@example.com"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 ${
              errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.email && touched.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Create a strong password"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 ${
              errors.password && touched.password ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {formData.password && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Password requirements:</p>
              <PasswordCheck passed={passwordChecks.length} text="At least 8 characters" />
              <PasswordCheck passed={passwordChecks.uppercase} text="One uppercase letter (A-Z)" />
              <PasswordCheck passed={passwordChecks.lowercase} text="One lowercase letter (a-z)" />
              <PasswordCheck passed={passwordChecks.number} text="One number (0-9)" />
              <PasswordCheck passed={passwordChecks.special} text="One special character (@$!%*?&)" />
            </div>
          )}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Confirm your password"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 ${
              errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.confirmPassword && touched.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
        Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-500">Sign in</Link>
      </p>
    </div>
  );
};

export default Register;
