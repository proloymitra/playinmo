import { Helmet } from "react-helmet";

export default function TermsOfServicePage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - PlayinMO</title>
        <meta name="description" content="Terms of Service for PlayinMO gaming platform." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-6">Last updated: May 15, 2025</p>
          
          <div className="prose dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using PlayinMO at playinmo.com ("website", "service", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, you may not access or use the service.
            </p>
            
            <h2>2. Description of Service</h2>
            <p>
              PlayinMO provides an online platform for users to play browser-based games, participate in leaderboards, chat with other users, and rate or review games. We reserve the right to modify, suspend, or discontinue the service or any part of it at any time, with or without notice.
            </p>
            
            <h2>3. User Accounts</h2>
            <p>
              To access certain features of the service, you may need to register for an account. When you register, you agree to provide accurate, current, and complete information and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all activities that occur under your account.
            </p>
            <p>
              We reserve the right to disable any user account if we believe you have violated these Terms of Service or if we determine, in our sole discretion, that your actions may compromise the security or proper functioning of our website.
            </p>
            
            <h2>4. User Content</h2>
            <p>
              Our service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material ("User Content"). You are solely responsible for the User Content that you post, and you agree not to post User Content that violates any applicable law or these Terms of Service.
            </p>
            <p>
              By posting User Content on or through the service, you grant us the right to use, modify, publicly perform, publicly display, reproduce, and distribute such content on and through the service. You retain any and all of your rights to any User Content you submit, post, or display on or through the service.
            </p>
            
            <h2>5. Prohibited Activities</h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <ul>
              <li>Using the service for any illegal purpose or in violation of any local, state, national, or international law</li>
              <li>Harassing, threatening, or intimidating other users</li>
              <li>Posting or transmitting content that is obscene, pornographic, violent, or otherwise offensive</li>
              <li>Impersonating another person or entity</li>
              <li>Attempting to gain unauthorized access to the service or its related systems</li>
              <li>Interfering with the proper working of the service</li>
              <li>Engaging in any automated use of the system, such as using scripts to send comments or messages</li>
              <li>Circumventing, disabling, or otherwise interfering with security-related features of the service</li>
            </ul>
            
            <h2>6. Intellectual Property</h2>
            <p>
              The service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of PlayinMO and its licensors. The service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
            </p>
            
            <h2>7. External Games and Links</h2>
            <p>
              Our service may contain links to third-party games, websites, or services that are not owned or controlled by PlayinMO. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You further acknowledge and agree that PlayinMO shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such websites or services.
            </p>
            
            <h2>8. Advertising</h2>
            <p>
              We may display advertisements on the service, including but not limited to Google AdSense ads. These advertisements may be targeted based on the content of the service, queries made through the service, or other information. The manner, mode, and extent of advertising on the service are subject to change without specific notice to you.
            </p>
            <p>
              By using the service, you agree to view these advertisements as part of the experience. If you have ad-blocking software enabled, we kindly ask you to whitelist our website as advertising helps support the free services we provide.
            </p>
            
            <h2>9. Limitation of Liability</h2>
            <p>
              In no event shall PlayinMO, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the service; (ii) any conduct or content of any third party on the service; (iii) any content obtained from the service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not we have been informed of the possibility of such damage.
            </p>
            
            <h2>10. Disclaimer</h2>
            <p>
              Your use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" basis. The service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
            </p>
            
            <h2>11. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
            
            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            
            <h2>13. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p><strong>Email:</strong> terms@playinmo.com</p>
          </div>
        </div>
      </div>
    </>
  );
}