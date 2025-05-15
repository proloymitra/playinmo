import { Helmet } from "react-helmet";

export default function CookiePolicyPage() {
  return (
    <>
      <Helmet>
        <title>Cookie Policy - PlayinMO</title>
        <meta name="description" content="Cookie Policy for PlayinMO gaming platform." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
          <p className="text-muted-foreground mb-6">Last updated: May 15, 2025</p>
          
          <div className="prose dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              This Cookie Policy explains how PlayinMO ("we", "us", "our") uses cookies and similar technologies on our website playinmo.com. This policy should be read alongside our Privacy Policy and Terms of Service, which provide further information about our data handling practices.
            </p>
            
            <h2>2. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners. Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device when you go offline, while session cookies are deleted as soon as you close your web browser.
            </p>
            
            <h2>3. How We Use Cookies</h2>
            <p>We use cookies for several purposes, including:</p>
            <ul>
              <li>
                <strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You cannot opt out of these cookies.
              </li>
              <li>
                <strong>Functionality Cookies:</strong> These cookies enable us to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
              </li>
              <li>
                <strong>Performance Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular and see how visitors move around the site.
              </li>
              <li>
                <strong>Targeting/Advertising Cookies:</strong> These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant ads on other sites.
              </li>
            </ul>
            
            <h2>4. Google AdSense and Advertising</h2>
            <p>
              We use Google AdSense to serve ads on our website. Google uses cookies to serve ads based on your prior visits to our website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.
            </p>
            <p>
              You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary underline">Google Ads Settings</a> or by visiting <a href="https://www.aboutads.info" className="text-primary underline">aboutads.info</a>.
            </p>
            
            <h2>5. Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service, deliver advertisements on and through the service, and so on. These may include:
            </p>
            <ul>
              <li>Google Analytics cookies for website analytics</li>
              <li>Google AdSense cookies for advertising</li>
              <li>Social media cookies for sharing content on platforms like Facebook, Twitter, etc.</li>
              <li>Third-party game service provider cookies</li>
            </ul>
            
            <h2>6. Managing Cookies</h2>
            <p>
              Most web browsers allow you to manage your cookie preferences. You can set your browser to refuse cookies or delete certain cookies. Generally, you can also set your browser to notify you when you receive a cookie, giving you the chance to decide whether to accept it.
            </p>
            <p>
              If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted. As the means by which you can refuse cookies through your web browser controls vary from browser to browser, you should visit your browser's help menu for more information.
            </p>
            
            <h2>7. Do Not Track Signals</h2>
            <p>
              Some browsers incorporate a "Do Not Track" (DNT) feature that, when turned on, signals to websites and online services that you do not wish to be tracked. Because there is not yet a common understanding of how to interpret DNT signals, we do not currently respond to DNT signals.
            </p>
            
            <h2>8. Changes to This Cookie Policy</h2>
            <p>
              We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
            </p>
            <p>
              Your continued use of our website after any changes to this Cookie Policy will constitute your acceptance of such changes and the updated policy. We encourage you to periodically review this page for the latest information on our cookie practices.
            </p>
            
            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about our Cookie Policy, please contact us at:
            </p>
            <p><strong>Email:</strong> privacy@playinmo.com</p>
          </div>
        </div>
      </div>
    </>
  );
}