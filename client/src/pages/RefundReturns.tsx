import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

export default function RefundReturns() {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Refund & Returns Policy | Economy Plumbing Services</title>
        <meta name="description" content="Economy Plumbing Services refund and returns policy for products and services." />
      </Helmet>

      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <h1 className="text-4xl font-bold mb-8">Refund & Returns Policy</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-6">
            Last Updated: October 7, 2025
          </p>

          <h2>Service Satisfaction Guarantee</h2>
          <p>
            At Economy Plumbing Services, we stand behind the quality of our work. If you're not completely satisfied with our service, please contact us within 30 days of service completion, and we'll work to make it right.
          </p>

          <h2>VIP Membership Refunds</h2>
          <h3>Cancellation Policy</h3>
          <p>
            VIP memberships can be canceled at any time. Refunds for unused portions of your membership are handled as follows:
          </p>
          <ul>
            <li><strong>First 30 Days:</strong> Full refund if no services have been used</li>
            <li><strong>After 30 Days:</strong> Pro-rated refund for unused months (if no services have been claimed)</li>
            <li><strong>After Service Use:</strong> No refund available once membership benefits have been used</li>
          </ul>

          <h3>How to Cancel</h3>
          <p>To cancel your VIP membership, contact us by phone at (512) 649-2811 or email. Cancellation requests must be submitted in writing.</p>

          <h2>Product Returns</h2>
          <h3>Return Eligibility</h3>
          <p>Products purchased from our online store may be returned within 30 days of purchase if:</p>
          <ul>
            <li>The product is unused and in its original packaging</li>
            <li>You have the original receipt or proof of purchase</li>
            <li>The product is not a special order or custom item</li>
          </ul>

          <h3>Non-Returnable Items</h3>
          <p>The following items cannot be returned:</p>
          <ul>
            <li>Opened or used products</li>
            <li>Special order or custom items</li>
            <li>Products damaged due to improper use or installation</li>
            <li>Clearance or final sale items</li>
          </ul>

          <h3>Return Process</h3>
          <p>To initiate a return:</p>
          <ol>
            <li>Contact us at (512) 649-2811 to obtain a return authorization</li>
            <li>Pack the item securely in its original packaging</li>
            <li>Include your receipt and return authorization number</li>
            <li>Ship the item to our address (return shipping costs are the customer's responsibility unless the item is defective)</li>
          </ol>

          <h3>Refund Processing</h3>
          <p>
            Once we receive and inspect your return, we'll process your refund within 5-7 business days. Refunds will be issued to the original payment method. Please allow additional time for your bank or credit card company to process the refund.
          </p>

          <h2>Service Guarantee</h2>
          <h3>Workmanship Warranty</h3>
          <p>
            We provide a one-year warranty on our workmanship. If you experience issues with our installation or repair within one year of service, we'll return to make it right at no additional charge.
          </p>

          <h3>Parts Warranty</h3>
          <p>
            Manufacturer warranties apply to all parts we install. Warranty periods vary by manufacturer and product. We'll provide warranty information at the time of service.
          </p>

          <h3>Warranty Exclusions</h3>
          <p>Our warranties do not cover:</p>
          <ul>
            <li>Damage caused by misuse, abuse, or lack of proper maintenance</li>
            <li>Modifications made by others after our service</li>
            <li>Normal wear and tear</li>
            <li>Acts of nature or circumstances beyond our control</li>
          </ul>

          <h2>Emergency Service Calls</h2>
          <p>
            Emergency service calls require immediate response and cannot be refunded once a technician has been dispatched. If the issue cannot be resolved, we'll apply your emergency service fee toward any necessary repairs or installations.
          </p>

          <h2>Payment Disputes</h2>
          <p>
            If you have concerns about charges or services, please contact us directly before initiating a chargeback with your credit card company. We're committed to resolving any issues fairly and promptly.
          </p>

          <h2>Contact Information</h2>
          <p>For questions about refunds, returns, or our satisfaction guarantee, please contact us:</p>
          <ul>
            <li><strong>Austin Area:</strong> (512) 649-2811</li>
            <li><strong>Marble Falls Area:</strong> (830) 460-3565</li>
            <li><strong>Address:</strong> 701 Tillery St #12, Austin, TX 78702</li>
          </ul>

          <h2>Changes to This Policy</h2>
          <p>
            We reserve the right to modify this Refund & Returns Policy at any time. Changes will be posted on this page with an updated revision date.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
