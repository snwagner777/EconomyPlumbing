/**
 * Review Request Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leave a Review | Economy Plumbing Services',
  description: 'Share your experience with Economy Plumbing Services. Leave a review on Google to help other customers find quality plumbing service.',
  openGraph: {
    title: 'Leave a Review - Economy Plumbing',
    description: 'Share your experience and help other customers',
  },
};

export default function ReviewRequestPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center">We Value Your Feedback</h1>
          
          <p className="text-xl text-muted-foreground mb-12 text-center">
            Your review helps us improve and helps others find quality plumbing service
          </p>

          <section className="bg-primary text-primary-foreground p-12 rounded-lg mb-12 text-center">
            <h2 className="text-3xl font-bold mb-6">Leave a Google Review</h2>
            <p className="text-lg mb-8">
              It only takes a minute and helps us tremendously!
            </p>
            <a 
              href="https://g.page/r/your-google-business-id/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-background text-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition"
            >
              Write a Google Review
            </a>
          </section>

          <section className="bg-card p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-center">Or Share Your Feedback Here</h2>
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="text-3xl hover:text-primary transition"
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <textarea 
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={6}
                  placeholder="Tell us about your experience..."
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Submit Feedback
              </button>
            </form>
          </section>

          <section className="text-center">
            <h2 className="text-xl font-semibold mb-4">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your feedback helps us serve you and our community better
            </p>
            <a 
              href="/"
              className="text-primary hover:underline"
            >
              ← Back to Home
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
