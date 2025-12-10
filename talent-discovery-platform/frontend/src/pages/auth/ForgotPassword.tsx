import React from 'react';

const ForgotPassword: React.FC = () => (
  <div className="max-w-md mx-auto px-4 py-12">
    <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>
    <form className="space-y-4">
      <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg" />
      <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Send Reset Link</button>
    </form>
  </div>
);

export default ForgotPassword;
