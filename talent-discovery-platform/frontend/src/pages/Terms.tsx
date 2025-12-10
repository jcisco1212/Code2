import React from 'react';

const Terms: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
    <div className="prose dark:prose-invert">
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing TalentVault, you agree to be bound by these Terms of Service.</p>
      <h2>2. User Accounts</h2>
      <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account.</p>
      <h2>3. Content Guidelines</h2>
      <p>Users must not upload content that is illegal, harmful, or infringes on others rights.</p>
      <h2>4. AI Analysis</h2>
      <p>Our AI scoring is for informational purposes and does not guarantee success in the entertainment industry.</p>
    </div>
  </div>
);

export default Terms;
