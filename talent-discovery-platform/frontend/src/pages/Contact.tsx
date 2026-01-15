import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (formData.message.trim().length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/contact', formData);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <img
          src="/images/get-noticed-logo.png"
          alt="Get Noticed"
          className="h-40 md:h-48 w-auto object-contain"
        />
      </div>

      <h1 className="text-3xl font-bold mb-6 text-white">Contact Us</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">Get in Touch</h2>
          <p className="text-gray-400 mb-4">Have questions? We would love to hear from you.</p>

          {/* Email Addresses */}
          <div className="mt-6 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-1">Support</h3>
              <a
                href="mailto:support@get-noticed.net"
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                support@get-noticed.net
              </a>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-1">Business Inquiries</h3>
              <a
                href="mailto:business@get-noticed.net"
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                business@get-noticed.net
              </a>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="w-full p-3 border border-gray-600 rounded-lg bg-yt-bg-secondary text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            disabled={isSubmitting}
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Your Email"
            className="w-full p-3 border border-gray-600 rounded-lg bg-yt-bg-secondary text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            disabled={isSubmitting}
          />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Your Message"
            rows={4}
            className="w-full p-3 border border-gray-600 rounded-lg bg-yt-bg-secondary text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
