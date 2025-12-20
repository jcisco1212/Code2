import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: December 20, 2024</p>

          <div className="prose prose-indigo dark:prose-invert max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Welcome to TalentVault</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                These Terms of Service ("Terms") govern your access to and use of the TalentVault platform,
                including our website, mobile applications, APIs, and all related services (collectively, the "Service").
                By accessing or using our Service, you agree to be bound by these Terms and our{' '}
                <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link>.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                If you do not agree to these Terms, you may not access or use the Service. We may modify these Terms
                at any time. Your continued use of the Service after any such changes constitutes your acceptance of
                the new Terms.
              </p>
            </section>

            {/* Who May Use the Service */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Who May Use the Service</h2>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Age Requirements</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You must be at least 13 years old to use the Service. If you are under 18, you represent that you have
                your parent or guardian's permission to use the Service. Parents or guardians who allow minors to use
                the Service are responsible for supervising their use and ensuring compliance with these Terms.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Account Registration</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To access certain features, you must create an account. When you create an account, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300">
                You may not use another person's account without their permission, create multiple accounts to evade
                restrictions, or sell or transfer your account.
              </p>
            </section>

            {/* Your Use of the Service */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Your Use of the Service</h2>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Permissions and Restrictions</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to
                access and use the Service for your personal, non-commercial use. You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Use the Service in any way that violates applicable laws or regulations</li>
                <li>Use automated systems (bots, scrapers, crawlers) to access the Service without permission</li>
                <li>Circumvent, disable, or interfere with security-related features</li>
                <li>Collect or harvest user information without consent</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                <li>Attempt to access areas of the Service that you are not authorized to access</li>
                <li>Use the Service to transmit viruses, malware, or other harmful code</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Engage in any activity that could damage, disable, or impair the Service</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Service Availability</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We strive to provide continuous access to the Service, but we do not guarantee that the Service will
                always be available or uninterrupted. We may suspend, withdraw, or restrict the availability of all
                or any part of the Service for business and operational reasons.
              </p>
            </section>

            {/* Your Content */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Your Content</h2>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Ownership</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You retain ownership of any intellectual property rights that you hold in the content you upload,
                post, or share through the Service ("Your Content"). TalentVault does not claim ownership of Your Content.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">License to TalentVault</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                By uploading, posting, or sharing Your Content through the Service, you grant TalentVault a worldwide,
                non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute,
                prepare derivative works of, display, and perform Your Content in connection with the Service and
                TalentVault's business operations, including for promoting and redistributing part or all of the
                Service in any media formats and through any media channels.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This license includes the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Analyze Your Content using AI and machine learning technologies</li>
                <li>Generate performance scores and insights based on Your Content</li>
                <li>Display Your Content to other users based on their interests and preferences</li>
                <li>Create transcripts, captions, and translations of Your Content</li>
                <li>Compress, reformat, or modify Your Content for technical purposes</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300">
                This license continues even if you stop using the Service, but only for content that has been shared
                with others and not deleted by you.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3 mt-6">Your Representations</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                By uploading Your Content, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>You own or have the necessary rights to Your Content</li>
                <li>Your Content does not infringe any third party's intellectual property or other rights</li>
                <li>You have obtained all necessary consents from individuals appearing in Your Content</li>
                <li>Your Content complies with these Terms and all applicable laws</li>
              </ul>
            </section>

            {/* Community Guidelines */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Community Guidelines</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To maintain a safe and respectful community, you agree not to post content that:
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Harmful or Dangerous Content</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Promotes violence, terrorism, or physical harm against individuals or groups</li>
                <li>Depicts or encourages dangerous activities or self-harm</li>
                <li>Contains graphic violence or gore intended to shock or disgust</li>
                <li>Promotes eating disorders, suicide, or other forms of self-injury</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Hateful Content</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Promotes hatred, discrimination, or violence based on race, ethnicity, national origin, religion,
                    gender identity, sexual orientation, age, disability, or veteran status</li>
                <li>Uses slurs or promotes stereotypes intended to demean or dehumanize</li>
                <li>Denies documented violent events or promotes conspiracy theories targeting protected groups</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Harassment and Bullying</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Targets individuals with prolonged or malicious insults, threats, or unwanted attention</li>
                <li>Reveals private information about individuals (doxxing)</li>
                <li>Encourages others to harass specific individuals</li>
                <li>Creates content mocking, threatening, or humiliating others</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Sexual Content</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Contains sexually explicit or pornographic material</li>
                <li>Depicts or promotes sexual exploitation of minors</li>
                <li>Contains non-consensual intimate imagery</li>
                <li>Promotes sexual services or solicitation</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Illegal Activities</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Promotes or provides instructions for illegal activities</li>
                <li>Facilitates sale of illegal goods or regulated substances</li>
                <li>Promotes fraud, scams, or deceptive practices</li>
                <li>Infringes copyrights, trademarks, or other intellectual property rights</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Misinformation</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Spreads demonstrably false information that could cause real-world harm</li>
                <li>Contains deceptive content designed to manipulate or mislead</li>
                <li>Promotes harmful health misinformation</li>
                <li>Interferes with elections or democratic processes</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Spam and Deceptive Practices</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Creates misleading metadata, titles, descriptions, or thumbnails</li>
                <li>Artificially inflates views, likes, comments, or other metrics</li>
                <li>Sends unsolicited bulk messages or promotions</li>
                <li>Impersonates other users, brands, or organizations</li>
              </ul>
            </section>

            {/* AI Features and Analysis */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. AI Features and Analysis</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                TalentVault uses artificial intelligence and machine learning technologies to analyze content,
                provide performance scores, and power various platform features.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Understanding AI Scores</h3>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>AI performance scores are generated by automated systems and represent algorithmic assessments</li>
                <li>Scores are provided for informational and entertainment purposes only</li>
                <li>AI scores do not guarantee success, recognition, or opportunities in any industry</li>
                <li>Scores may change as our AI systems evolve and improve</li>
                <li>AI analysis may not capture all aspects of artistic merit or potential</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">AI Content Moderation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We use AI systems to help detect potential violations of our Community Guidelines. While we strive
                for accuracy, automated systems may make errors. You may appeal content moderation decisions through
                our appeals process.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Intellectual Property</h2>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">TalentVault's Rights</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The Service and its original content (excluding Your Content), features, and functionality are and
                will remain the exclusive property of TalentVault and its licensors. The Service is protected by
                copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection
                with any product or service without prior written consent.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Copyright Infringement</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We respect intellectual property rights and expect our users to do the same. We will respond to
                notices of alleged copyright infringement that comply with applicable law. If you believe your
                copyrighted work has been copied in a way that constitutes copyright infringement, please provide
                us with the following information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>A physical or electronic signature of the copyright owner or authorized representative</li>
                <li>Identification of the copyrighted work claimed to have been infringed</li>
                <li>Identification of the material that is claimed to be infringing and its location</li>
                <li>Your contact information (address, telephone number, and email)</li>
                <li>A statement that you have a good faith belief that the use is not authorized</li>
                <li>A statement, under penalty of perjury, that the information is accurate and you are authorized to act</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Repeat Infringers</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We will terminate the accounts of repeat infringers in appropriate circumstances.
              </p>
            </section>

            {/* Account Suspension and Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Account Suspension and Termination</h2>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">By TalentVault</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We may suspend or terminate your access to the Service at any time, with or without cause, with or
                without notice, effective immediately. Reasons for termination may include, but are not limited to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Violations of these Terms or Community Guidelines</li>
                <li>Conduct that we believe is harmful to other users, third parties, or our business</li>
                <li>Suspected fraudulent, abusive, or illegal activity</li>
                <li>Extended periods of inactivity</li>
                <li>Upon request by law enforcement or government agencies</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">By You</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You may delete your account at any time through your account settings. Upon account deletion:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Your profile and videos will be removed from public view</li>
                <li>Some information may be retained as required by law or for legitimate business purposes</li>
                <li>Content shared by others or cached by third parties may remain accessible</li>
                <li>Certain data may be retained in anonymized form for analytics purposes</li>
              </ul>
            </section>

            {/* Disclaimers */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Disclaimers</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4 uppercase font-medium">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
                OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                TalentVault does not warrant that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                <li>The results obtained from using the Service will be accurate or reliable</li>
                <li>The quality of the Service will meet your expectations</li>
                <li>Any errors in the Service will be corrected</li>
                <li>AI-generated scores or analysis will be accurate, complete, or useful</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4 uppercase font-medium">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TALENTVAULT AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND
                AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY
                LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Your access to or use of or inability to access or use the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                <li>Reliance on AI-generated scores, recommendations, or analysis</li>
              </ul>
            </section>

            {/* Indemnification */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Indemnification</h2>
              <p className="text-gray-600 dark:text-gray-300">
                You agree to defend, indemnify, and hold harmless TalentVault, its parent, subsidiaries, affiliates,
                officers, directors, employees, agents, partners, and licensors from and against any claims, damages,
                obligations, losses, liabilities, costs, or debt, and expenses (including attorneys' fees) arising
                from: (a) your use of and access to the Service; (b) your violation of any term of these Terms;
                (c) your violation of any third party right, including any copyright, property, or privacy right;
                or (d) any claim that Your Content caused damage to a third party.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Dispute Resolution</h2>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Informal Resolution</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Before filing a claim, you agree to try to resolve the dispute informally by contacting us. We'll
                try to resolve the dispute informally by contacting you via email. If a dispute is not resolved
                within 30 days of submission, you or TalentVault may bring a formal proceeding.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Arbitration Agreement</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You and TalentVault agree to resolve any claims relating to these Terms or the Service through
                final and binding arbitration, except as set forth below. The arbitration will be conducted under
                the rules of the American Arbitration Association ("AAA").
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Class Action Waiver</h3>
              <p className="text-gray-600 dark:text-gray-300">
                You agree that any dispute resolution proceedings will be conducted only on an individual basis
                and not in a class, consolidated, or representative action. If this specific provision is found
                to be unenforceable, then the entirety of this arbitration section shall be null and void.
              </p>
            </section>

            {/* General Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. General Terms</h2>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Governing Law</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                These Terms shall be governed by the laws of the State of Delaware, United States, without regard
                to its conflict of law provisions.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Entire Agreement</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                These Terms constitute the entire agreement between you and TalentVault regarding the Service and
                supersede all prior agreements and understandings.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Severability</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain
                in full force and effect.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">No Waiver</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of
                those rights.
              </p>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Assignment</h3>
              <p className="text-gray-600 dark:text-gray-300">
                You may not assign or transfer these Terms or your rights under these Terms. We may freely assign
                our rights and obligations under these Terms.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Contact Us</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>TalentVault Legal Team</strong><br />
                  Email: legal@talentvault.com<br />
                  Address: 123 Innovation Drive, Suite 500<br />
                  San Francisco, CA 94105<br />
                  United States
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <p className="text-gray-600 dark:text-gray-300 text-center italic">
                By using TalentVault, you acknowledge that you have read, understood, and agree to be bound by
                these Terms of Service.
              </p>
            </section>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-gray-400">|</span>
          <Link to="/community-guidelines" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Community Guidelines
          </Link>
          <span className="text-gray-400">|</span>
          <Link to="/copyright" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Copyright Policy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;
