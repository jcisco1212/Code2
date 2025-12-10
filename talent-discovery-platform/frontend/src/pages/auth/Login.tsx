import React from 'react';
import { Link } from 'react-router-dom';

const Login: React.FC = () => (
  <div className="max-w-md mx-auto px-4 py-12">
    <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
    <form className="space-y-4">
      <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg" />
      <input type="password" placeholder="Password" className="w-full p-3 border rounded-lg" />
      <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Sign In</button>
    </form>
    <p className="text-center mt-4 text-gray-600">
      Don't have an account? <Link to="/register" className="text-indigo-600">Sign up</Link>
    </p>
  </div>
);

export default Login;
