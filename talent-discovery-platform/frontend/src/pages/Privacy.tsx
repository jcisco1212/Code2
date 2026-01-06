import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: January 6, 2025</p>

          <div className="prose prose-indigo dark:prose-invert max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Introduction</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Get-Noticed ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you use our platform,
                including our website, mobile applications, and related services (collectively, the "Service").
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                By accessing or using our Service, you agree to this Privacy Policy. If you do not agree with
                our policies and practices, please do not use our Service. We encourage you to review this
                Privacy Policy periodically as we may update it from time to time.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Information You Provide</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We collect information you voluntarily provide when you:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li><strong>Create an account:</strong> Name, email address, username, password, date of birth, and country</li>
                <li><strong>Complete your profile:</strong> Profile photo, biography, social media links, and professional information</li>
                <li><strong>Upload content:</strong> Videos, images, titles, descriptions, and tags</li>
                <li><strong>Communicate with us:</strong> Messages, feedback, support requests, and survey responses</li>
                <li><strong>Register as an industry professional:</strong> Company name, professional role, license number (optional), and LinkedIn profile URL for verification purposes</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Information Collected Automatically</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                When you use our Service, we may automatically collect:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li><strong>Device information:</strong> Device type, operating system, browser type, and unique device identifiers</li>
                <li><strong>Usage data:</strong> Pages visited, features used, videos watched, time spent, and interaction patterns</li>
                <li><strong>Log data:</strong> IP address, access times, referring URLs, and error logs</li>
                <li><strong>Location data:</strong> General geographic location based on IP address (country level)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Cookies and Similar Technologies</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We use cookies and similar tracking technologies to enhance your experience:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong>Essential cookies:</strong> Required for the Service to function properly (authentication, security)</li>
                <li><strong>Functional cookies:</strong> Remember your preferences (theme, language, display settings)</li>
                <li><strong>Analytics cookies:</strong> Help us understand how users interact with our Service</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                You can control cookies through your browser settings. Note that disabling certain cookies may
                affect the functionality of our Service.
              </p>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We use the information we collect for the following purposes:
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Service Operations</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process your account registration and manage your profile</li>
                <li>Enable content uploads, sharing, and discovery</li>
                <li>Facilitate communication between users</li>
                <li>Process transactions and send related information</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">AI Analysis and Features</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Analyze uploaded content to generate performance scores and insights</li>
                <li>Provide personalized recommendations based on your interests</li>
                <li>Power talent discovery features for industry professionals</li>
                <li>Detect and prevent violations of our Community Guidelines</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Communication</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Send service-related notices and updates</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Notify you about changes to our policies</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Safety and Security</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Verify industry professional accounts to prevent fraud and scams</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Enforce our Terms of Service and Community Guidelines</li>
                <li>Protect the rights and safety of our users and the public</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. How We Share Your Information</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">With Other Users</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Information you choose to make public (profile information, uploaded content, comments)
                will be visible to other users according to your privacy settings.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">With Service Providers</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We may share information with third-party vendors who perform services on our behalf, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Cloud hosting and storage providers</li>
                <li>Payment processors</li>
                <li>Analytics providers</li>
                <li>Customer support services</li>
                <li>Content delivery networks</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">For Legal Reasons</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We may disclose your information if required to do so by law or in response to valid legal
                requests, including subpoenas, court orders, or government inquiries.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Business Transfers</h3>
              <p className="text-gray-600 dark:text-gray-300">
                If we are involved in a merger, acquisition, or sale of assets, your information may be
                transferred as part of that transaction. We will notify you of any change in ownership
                or uses of your personal information.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Data Retention</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We retain your information for as long as necessary to provide our Service and fulfill
                the purposes described in this Privacy Policy. Specifically:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong>Account information:</strong> Retained while your account is active and for a reasonable period afterward</li>
                <li><strong>Content:</strong> Retained until you delete it or your account is terminated</li>
                <li><strong>Usage data:</strong> Typically retained for up to 2 years, then aggregated or anonymized</li>
                <li><strong>Legal requirements:</strong> Some data may be retained longer to comply with legal obligations</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                When you delete your account, we will delete or anonymize your personal information within
                30 days, except where retention is required for legal purposes.
              </p>
            </section>

            {/* Your Rights and Choices */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Your Rights and Choices</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Access and Portability</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You can access most of your information through your account settings. You may also request
                a copy of your data in a portable format.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Correction</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You can update or correct your profile information at any time through your account settings.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Deletion</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You can delete your account through your settings. Upon deletion, we will remove your
                personal information as described in the Data Retention section.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Communication Preferences</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You can opt out of promotional emails by clicking the unsubscribe link in any promotional
                message. Note that you cannot opt out of service-related communications.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Cookie Preferences</h3>
              <p className="text-gray-600 dark:text-gray-300">
                You can manage cookie preferences through your browser settings. Most browsers allow you
                to block or delete cookies.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Children's Privacy</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Our Service is not intended for children under the age of 13. We do not knowingly collect
                personal information from children under 13. If you are a parent or guardian and believe
                your child has provided us with personal information, please contact us immediately.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Users between 13 and 18 years of age should have parental consent before using the Service.
                Parents or guardians are responsible for supervising their minor's use of the Service.
              </p>
            </section>

            {/* Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Security</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. These
                measures include:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security assessments and monitoring</li>
                <li>Access controls and employee training</li>
                <li>Incident response procedures</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure.
                While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* International Data Transfers */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. International Data Transfers</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Your information may be transferred to, stored, and processed in countries other than your
                own. By using our Service, you consent to the transfer of your information to countries
                that may have different data protection laws than your country. We take steps to ensure
                that your information receives an adequate level of protection in the jurisdictions in
                which we process it.
              </p>
            </section>

            {/* California Privacy Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. California Privacy Rights</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you are a California resident, you have additional rights under the California Consumer
                Privacy Act (CCPA):
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong>Right to know:</strong> Request information about the categories and specific pieces of personal information we collect</li>
                <li><strong>Right to delete:</strong> Request deletion of your personal information</li>
                <li><strong>Right to opt-out:</strong> Opt out of the sale of personal information (note: we do not sell personal information)</li>
                <li><strong>Right to non-discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>

            {/* European Privacy Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. European Privacy Rights (GDPR)</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland,
                you have additional rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong>Legal basis:</strong> We process your data based on consent, contract performance, legitimate interests, or legal obligations</li>
                <li><strong>Right to object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Right to restrict:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Right to erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
                <li><strong>Right to lodge a complaint:</strong> File a complaint with your local data protection authority</li>
              </ul>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We may update this Privacy Policy from time to time to reflect changes in our practices
                or applicable laws. We will notify you of any material changes by posting the new Privacy
                Policy on this page and updating the "Last updated" date. We encourage you to review this
                Privacy Policy periodically. Your continued use of the Service after any changes constitutes
                your acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* Contact Us */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Contact Us</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our
                privacy practices, please contact us at:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Get-Noticed Privacy Team</strong><br />
                  Email: privacy@get-noticed.com<br />
                  Address: 123 Innovation Drive, Suite 500<br />
                  San Francisco, CA 94105<br />
                  United States
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                For data subject requests (access, deletion, correction), please email us at
                privacy@get-noticed.com with the subject line "Data Subject Request."
              </p>
            </section>

            {/* Acknowledgment */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <p className="text-gray-600 dark:text-gray-300 text-center italic">
                By using Get-Noticed, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </section>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <Link to="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Terms of Service
          </Link>
          <span className="text-gray-400">|</span>
          <Link to="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Contact Us
          </Link>
          <span className="text-gray-400">|</span>
          <Link to="/about" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            About Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
