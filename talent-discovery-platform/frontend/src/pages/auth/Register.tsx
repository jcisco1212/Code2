import React from 'react';
import { Link } from 'react-router-dom';

const Register: React.FC = () => (
  <div className="max-w-md mx-auto px-4 py-12">
    <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input type="text" placeholder="First Name" className="w-full p-3 border rounded-lg" />
        <input type="text" placeholder="Last Name" className="w-full p-3 border rounded-lg" />
      </div>
      <input type="text" placeholder="Username" className="w-full p-3 border rounded-lg" />
      <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg" />
      <input type="password" placeholder="Password" className="w-full p-3 border rounded-lg" />
      <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Create Account</button>
    </form>
    <p className="text-center mt-4 text-gray-600">
      Already have an account? <Link to="/login" className="text-indigo-600">Sign in</Link>
    </p>
  </div>
);

export default Register;
