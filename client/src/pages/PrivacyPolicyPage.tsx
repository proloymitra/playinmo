import { Helmet } from "react-helmet";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - PlayinMO</title>
        <meta name="description" content="Privacy Policy for PlayinMO gaming platform." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-6">Last updated: May 15, 2025</p>
          
          <div className="prose dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Welcome to PlayinMO ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website playinmo.com and use our services, including our gaming platform.
            </p>
            
            <h2>2. Information We Collect</h2>
            <p>We may collect several types of information from and about users of our website, including:</p>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, and profile information when you register for an account.</li>
              <li><strong>Usage Data:</strong> Information on how you interact with our website, the games you play, your scores, and gameplay statistics.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, operating system, and other technologies on the devices you use to access our website.</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to track activity on our website and store certain information.</li>
            </ul>
            
            <h2>3. How We Use Your Information</h2>
            <p>We may use the information we collect from you for various purposes, such as:</p>
            <ul>
              <li>Providing, operating, and maintaining our website and services</li>
              <li>Improving, personalizing, and expanding our website and services</li>
              <li>Understanding and analyzing how you use our website</li>
              <li>Developing new products, services, features, and functionality</li>
              <li>Communicating with you, including for customer service and updates</li>
              <li>For security and fraud prevention</li>
              <li>For compliance with legal obligations</li>
              <li>As described to you when collecting your personal information</li>
            </ul>
            
            <h2>4. Disclosure of Your Information</h2>
            <p>We may share information we have collected about you in certain situations, including:</p>
            <ul>
              <li><strong>With Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf.</li>
              <li><strong>For Business Transfers:</strong> We may share or transfer your information in connection with a merger, acquisition, reorganization, sale of assets, or bankruptcy.</li>
              <li><strong>For Legal Compliance:</strong> We may disclose your information to comply with applicable laws and regulations, respond to legal requests, and protect our rights.</li>
            </ul>
            
            <h2>5. Third-Party Advertising</h2>
            <p>
              We may use third-party advertising companies, including Google AdSense, to serve ads when you visit our website. These companies may use information about your visits to this and other websites to provide advertisements about goods and services of interest to you. This information does not include personally identifiable information such as your name, address, email address, or telephone number.
            </p>
            <p>
              Google AdSense uses cookies to serve ads based on your prior visits to our website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary underline">Google Ads Settings</a>.
            </p>
            
            <h2>6. Children's Privacy</h2>
            <p>
              Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and you believe your child has provided us with personal information, please contact us so that we can take appropriate action.
            </p>
            
            <h2>7. Your Choices and Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul>
              <li>The right to access and receive a copy of your personal information</li>
              <li>The right to rectify or update your personal information</li>
              <li>The right to delete your personal information</li>
              <li>The right to restrict or object to processing of your personal information</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
            </ul>
            
            <h2>8. Data Security</h2>
            <p>
              We have implemented appropriate security measures to protect the security of your personal information. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
            </p>
            
            <h2>9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
            
            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p><strong>Email:</strong> privacy@playinmo.com</p>
          </div>
        </div>
      </div>
    </>
  );
}