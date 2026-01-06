import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { categoriesAPI } from '../../services/api';
import { SparklesIcon, UserIcon, EnvelopeIcon, LockClosedIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

// Country options
const countryOptions = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Sweden', 'Norway',
  'Denmark', 'Finland', 'Ireland', 'Switzerland', 'Austria', 'Portugal',
  'Poland', 'Czech Republic', 'Greece', 'Hungary', 'Romania', 'Bulgaria',
  'Croatia', 'Slovakia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania',
  'Japan', 'South Korea', 'China', 'India', 'Singapore', 'Malaysia',
  'Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'Taiwan', 'Hong Kong',
  'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela',
  'South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Morocco', 'Ghana',
  'New Zealand', 'Israel', 'United Arab Emirates', 'Saudi Arabia', 'Turkey',
  'Russia', 'Ukraine', 'Other'
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
    country: '',
    location: '',
    artistType: '',
    genre: '',
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

    if (touched.country && !formData.country) {
      newErrors.country = 'Country is required';
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
      ethnicity: true,
      country: true
    });

    const { firstName, lastName, username, email, password, confirmPassword, gender, dateOfBirth, ethnicity, country, location, artistType, genre, talentCategory } = formData;

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

    if (!country) {
      toast.error('Please select your country');
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
        country,
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
    <div className={`flex items-center gap-2 text-sm transition-colors ${passed ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
      {passed ? (
        <CheckIcon className="w-4 h-4" />
      ) : (
        <XMarkIcon className="w-4 h-4" />
      )}
      <span>{text}</span>
    </div>
  );

  // Common input styles
  const inputStyles = `w-full px-4 py-3.5 rounded-xl
    bg-white/50 dark:bg-white/5
    border border-gray-200/50 dark:border-white/10
    text-gray-900 dark:text-white
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
    backdrop-blur-sm transition-all`;

  const inputErrorStyles = 'border-red-400 dark:border-red-500/50 focus:ring-red-500/50';

  const selectStyles = `${inputStyles} appearance-none bg-no-repeat bg-right pr-10 text-gray-900 dark:text-white [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:bg-gray-800 dark:[&>option]:text-white`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-secondary-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative">
        {/* Glass Card */}
        <div className="relative overflow-hidden rounded-3xl
                        bg-white/70 dark:bg-white/5
                        backdrop-blur-xl
                        border border-white/50 dark:border-white/10
                        shadow-xl dark:shadow-2xl
                        p-8">

          {/* Gradient accent at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                            bg-gradient-to-br from-primary-500 to-accent-500
                            shadow-aurora mb-4">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {defaultRole === 'agent' ? 'Join as a Talent Agent' : 'Join as a Creator'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className={`${inputStyles} ${errors.firstName && touched.firstName ? inputErrorStyles : ''}`}
                  required
                />
                {errors.firstName && touched.firstName && (
                  <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className={`${inputStyles} ${errors.lastName && touched.lastName ? inputErrorStyles : ''}`}
                  required
                />
                {errors.lastName && touched.lastName && (
                  <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="johndoe123"
                  className={`${inputStyles} pl-12 ${errors.username && touched.username ? inputErrorStyles : ''}`}
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Letters, numbers, and underscores only. 3-50 characters.
              </p>
              {errors.username && touched.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  className={`${inputStyles} pl-12 ${errors.email && touched.email ? inputErrorStyles : ''}`}
                  required
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Demographics Section */}
            <div className="pt-4 border-t border-gray-200/50 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-xs">👤</span>
                Demographics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${selectStyles} ${errors.gender && touched.gender ? inputErrorStyles : ''}`}
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
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`${inputStyles} ${errors.dateOfBirth && touched.dateOfBirth ? inputErrorStyles : ''}`}
                    required
                  />
                  {errors.dateOfBirth && touched.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="ethnicity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ethnicity *
                </label>
                <select
                  id="ethnicity"
                  name="ethnicity"
                  value={formData.ethnicity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${selectStyles} ${errors.ethnicity && touched.ethnicity ? inputErrorStyles : ''}`}
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
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country *
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${selectStyles} ${errors.country && touched.country ? inputErrorStyles : ''}`}
                  required
                >
                  <option value="">Select your country</option>
                  {countryOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.country && touched.country && (
                  <p className="mt-1 text-sm text-red-500">{errors.country}</p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City/State
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                  className={inputStyles}
                />
              </div>
            </div>

            {/* Talent Info (only for creators) */}
            {defaultRole !== 'agent' && (
              <div className="pt-4 border-t border-gray-200/50 dark:border-white/10">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-xs">🎭</span>
                  Talent Information
                </h3>

                <div>
                  <label htmlFor="talentCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Talent Category
                  </label>
                  <select
                    id="talentCategory"
                    name="talentCategory"
                    value={formData.talentCategory}
                    onChange={handleChange}
                    className={selectStyles}
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
                      <label htmlFor="artistType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Artist Type
                      </label>
                      <select
                        id="artistType"
                        name="artistType"
                        value={formData.artistType}
                        onChange={handleChange}
                        className={selectStyles}
                      >
                        <option value="">Select type</option>
                        <option value="solo">Solo Artist</option>
                        <option value="band">Band</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="genre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Genre
                      </label>
                      <select
                        id="genre"
                        name="genre"
                        value={formData.genre}
                        onChange={handleChange}
                        className={selectStyles}
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

            {/* Password Section */}
            <div className="pt-4 border-t border-gray-200/50 dark:border-white/10">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Create a strong password"
                    className={`${inputStyles} pl-12 ${errors.password && touched.password ? inputErrorStyles : ''}`}
                    required
                  />
                </div>
                {formData.password && (
                  <div className="mt-3 p-4 rounded-xl bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/50 dark:border-white/10 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Password requirements:</p>
                    <PasswordCheck passed={passwordChecks.length} text="At least 8 characters" />
                    <PasswordCheck passed={passwordChecks.uppercase} text="One uppercase letter (A-Z)" />
                    <PasswordCheck passed={passwordChecks.lowercase} text="One lowercase letter (a-z)" />
                    <PasswordCheck passed={passwordChecks.number} text="One number (0-9)" />
                    <PasswordCheck passed={passwordChecks.special} text="One special character (@$!%*?&)" />
                  </div>
                )}
              </div>
              <div className="mt-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Confirm your password"
                    className={`${inputStyles} pl-12 ${errors.confirmPassword && touched.confirmPassword ? inputErrorStyles : ''}`}
                    required
                  />
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-white
                       bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600
                       hover:from-primary-500 hover:via-secondary-500 hover:to-accent-500
                       shadow-lg hover:shadow-aurora
                       transform hover:-translate-y-0.5
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</Link>
            </p>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200/50 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/70 dark:bg-transparent text-gray-500 dark:text-gray-400">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Sign in link */}
          <Link
            to="/login"
            className="block w-full py-3.5 rounded-xl font-semibold text-center
                     text-primary-600 dark:text-primary-400
                     bg-primary-500/10 dark:bg-primary-500/20
                     border border-primary-500/20 dark:border-primary-500/30
                     hover:bg-primary-500/20 dark:hover:bg-primary-500/30
                     transition-all duration-300"
          >
            Sign In
          </Link>
        </div>

        {/* Bottom decorative gradient */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-gradient-to-r from-primary-500/30 via-secondary-500/30 to-accent-500/30 blur-xl rounded-full" />
      </div>
    </div>
  );
};

export default Register;
