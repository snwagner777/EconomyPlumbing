import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEO/SEOHead";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Privacy Policy | Economy Plumbing Services"
        description="Economy Plumbing Services privacy policy. Learn how we collect, use, and protect your personal information. Your privacy is important to us."
        canonical="https://economyplumbingservices.com/privacy-policy"
      />

      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-6">
            Last Updated: October 7, 2025
          </p>

          <h2>Introduction</h2>
          <p>
            Economy Plumbing Services ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>

          <h2>Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>We may collect personal information that you voluntarily provide to us when you:</p>
          <ul>
            <li>Schedule a service appointment</li>
            <li>Contact us for information</li>
            <li>Sign up for our newsletter or VIP membership</li>
            <li>Make a purchase through our online store</li>
          </ul>
          <p>This information may include your name, email address, phone number, physical address, and payment information.</p>

          <h3>Automatically Collected Information</h3>
          <p>When you visit our website, we may automatically collect certain information about your device, including:</p>
          <ul>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>IP address</li>
            <li>Pages visited and time spent on pages</li>
            <li>Referring website addresses</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process your transactions and send you related information</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
          </ul>

          <h2>Information Sharing and Disclosure</h2>
          <p>We may share your information in the following situations:</p>
          <ul>
            <li><strong>With Service Providers:</strong> We may share your information with third-party vendors who perform services on our behalf, such as payment processing, data analysis, and email delivery.</li>
            <li><strong>For Legal Reasons:</strong> We may disclose your information if required by law or if we believe that such action is necessary to comply with legal obligations or protect our rights.</li>
            <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>

          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
          </p>

          <h2>Your Rights and Choices</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access, update, or delete your personal information</li>
            <li>Opt-out of receiving marketing communications from us</li>
            <li>Request that we restrict the processing of your personal information</li>
            <li>Object to our processing of your personal information</li>
          </ul>
          <p>To exercise these rights, please contact us using the information provided below.</p>

          <h2>Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us.
          </p>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>

          <h2>Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us:</p>
          <ul>
            <li>By phone: (512) 368-9159 (Austin) or (830) 460-3565 (Marble Falls)</li>
            <li>By mail: 701 Tillery St #12, Austin, TX 78702</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
}
