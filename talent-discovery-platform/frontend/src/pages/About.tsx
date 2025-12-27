import React from 'react';

const About: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6">About Get-Noticed</h1>
    <div className="prose dark:prose-invert">
      <p>Get-Noticed is an AI-powered talent discovery platform designed to help aspiring performers showcase their talents and connect with entertainment industry professionals.</p>
      <h2>Our Mission</h2>
      <p>To democratize talent discovery by using AI to identify and promote rising stars, regardless of their background or connections.</p>
      <h2>Features</h2>
      <ul>
        <li>AI-powered performance scoring</li>
        <li>Talent category detection</li>
        <li>Entertainment agent dashboard</li>
        <li>Trending talent discovery</li>
        <li>Direct messaging with agents</li>
      </ul>
    </div>
  </div>
);

export default About;
