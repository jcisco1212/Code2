import React from 'react';

const Contact: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
        <p className="text-gray-600 mb-4">Have questions? We would love to hear from you.</p>
        <p className="mb-2"><strong>Email:</strong> support@talentvault.com</p>
        <p className="mb-2"><strong>Business:</strong> business@talentvault.com</p>
      </div>
      <form className="space-y-4">
        <input type="text" placeholder="Your Name" className="w-full p-3 border rounded-lg" />
        <input type="email" placeholder="Your Email" className="w-full p-3 border rounded-lg" />
        <textarea placeholder="Your Message" rows={4} className="w-full p-3 border rounded-lg" />
        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">Send Message</button>
      </form>
    </div>
  </div>
);

export default Contact;
