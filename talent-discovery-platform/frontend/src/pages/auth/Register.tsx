import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { categoriesAPI } from '../../services/api';

// Ethnicity options
const ethnicityOptions = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native Hawaiian or Pacific Islander',
  'White',
  'Two or More Races',
  'Prefer not to say',
  'Other'
];

// Genre options for music
const genreOptions = [
  'Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Jazz', 'Classical',
  'Electronic', 'Folk', 'Blues', 'Reggae', 'Latin', 'Metal', 'Punk',
  'Soul', 'Funk', 'Gospel', 'Alternative', 'Indie', 'World Music', 'Other'
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'user';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dateOfBirth: '',
    ethnicity: '',
    location: '',
    // Music-specific
    artistType: '',
    genre: '',
    // Talent category
    talentCategory: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch talent categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Check if selected category is music-related
  const isMusicCategory = () => {
    const musicSlugs = ['music', 'solo-artists', 'bands', 'singing'];
    const selectedCategory = categories.find(c => c.id === formData.talentCategory);
    return selectedCategory && musicSlugs.includes(selectedCategory.slug);
  };

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

  const validateDateOfBirth = (dob: string) => {
    if (!dob) return 'Date of birth is required';
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) return 'You must be at least 13 years old';
    if (age > 120) return 'Please enter a valid date of birth';
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

    if (touched.dateOfBirth) {
      const dobError = validateDateOfBirth(formData.dateOfBirth);
      if (dobError) newErrors.dateOfBirth = dobError;
    }

    if (touched.gender && !formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (touched.ethnicity && !formData.ethnicity) {
      newErrors.ethnicity = 'Ethnicity is required';
    }

    setErrors(newErrors);
  }, [formData, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all required fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
      gender: true,
      dateOfBirth: true,
      ethnicity: true
    });

    const { firstName, lastName, username, email, password, confirmPassword, gender, dateOfBirth, ethnicity, location, artistType, genre, talentCategory } = formData;

    // Validate all fields
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const dobError = validateDateOfBirth(dateOfBirth);

    if (usernameError || emailError || passwordError || dobError) {
      toast.error('Please fix the validation errors');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your first and last name');
      return;
    }

    if (!gender) {
      toast.error('Please select your gender');
      return;
    }

    if (!ethnicity) {
      toast.error('Please select your ethnicity');
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
      await register({
        firstName,
        lastName,
        username,
        email,
        password,
        gender,
        dateOfBirth,
        ethnicity,
        location: location || undefined,
        artistType: artistType || undefined,
        genre: genre || undefined,
        talentCategories: talentCategory ? [talentCategory] : undefined,
        role: defaultRole === 'agent' ? 'agent' : 'creator'
      });
      toast.success('Account created! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
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
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">Create Account</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
        {defaultRole === 'agent' ? 'Join as a Talent Agent' : 'Join as a Creator'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name *
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
              Last Name *
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
            Username *
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
            Email Address *
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

        {/* Demographics */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Demographics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 ${
                  errors.gender && touched.gender ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
              {errors.gender && touched.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
              )}
            </div>
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth *
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 ${
                  errors.dateOfBirth && touched.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.dateOfBirth && touched.dateOfBirth && (
                <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="ethnicity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ethnicity *
            </label>
            <select
              id="ethnicity"
              name="ethnicity"
              value={formData.ethnicity}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 ${
                errors.ethnicity && touched.ethnicity ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select ethnicity</option>
              {ethnicityOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.ethnicity && touched.ethnicity && (
              <p className="mt-1 text-sm text-red-500">{errors.ethnicity}</p>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, State"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Talent Info (only for creators) */}
        {defaultRole !== 'agent' && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Talent Information</h3>

            <div>
              <label htmlFor="talentCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Primary Talent Category
              </label>
              <select
                id="talentCategory"
                name="talentCategory"
                value={formData.talentCategory}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Music-specific fields */}
            {isMusicCategory() && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="artistType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Artist Type
                  </label>
                  <select
                    id="artistType"
                    name="artistType"
                    value={formData.artistType}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                  >
                    <option value="">Select type</option>
                    <option value="solo">Solo Artist</option>
                    <option value="band">Band</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="genre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Genre
                  </label>
                  <select
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                  >
                    <option value="">Select genre</option>
                    {genreOptions.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Password */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password *
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
          <div className="mt-4">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password *
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
        </p>
      </form>
      <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
        Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-500">Sign in</Link>
      </p>
    </div>
  );
};

export default Register;
