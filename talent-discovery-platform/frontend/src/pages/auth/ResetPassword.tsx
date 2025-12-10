import React from 'react';

const ResetPassword: React.FC = () => (
  <div className="max-w-md mx-auto px-4 py-12">
    <h1 className="text-2xl font-bold text-center mb-6">Set New Password</h1>
    <form className="space-y-4">
      <input type="password" placeholder="New Password" className="w-full p-3 border rounded-lg" />
      <input type="password" placeholder="Confirm Password" className="w-full p-3 border rounded-lg" />
      <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Reset Password</button>
    </form>
  </div>
);

export default ResetPassword;
