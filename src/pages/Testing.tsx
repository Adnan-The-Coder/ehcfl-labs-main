import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import SignIn from '@/components/Sign-in';

export default function Testing() {
  const [signInOpen, setSignInOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-foreground">
                Sign-In Component Testing
              </h1>
              <p className="text-lg text-muted-foreground">
                Test the Sign-in modal component with various scenarios
              </p>
            </div>

            {/* Test Controls */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  Component State
                </h2>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setSignInOpen(true)}
                    className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    Open Sign-In Modal
                  </button>
                  
                  <button
                    onClick={() => setSignInOpen(false)}
                    className="w-full px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/90 transition-colors"
                  >
                    Close Sign-In Modal
                  </button>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Current Modal State:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {signInOpen ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Modal is <strong>OPEN</strong>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Modal is <strong>CLOSED</strong>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Testing Features */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Features to Test
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground mb-2">
                    ✅ Email Sign-In
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Test email/password authentication with user profile creation
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground mb-2">
                    ✅ Google OAuth
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Test Google sign-in with redirect to /auth/callback
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground mb-2">
                    ✅ Geolocation Storage
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Verify location data is stored in localStorage with pin address
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground mb-2">
                    ✅ User Profile Update
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Check backend updates with login info and IP address
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground mb-2">
                    ✅ Error Handling
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Test invalid credentials and error messages
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg border border-border">
                  <h3 className="font-semibold text-foreground mb-2">
                    ✅ Responsive Design
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Test modal on mobile, tablet, and desktop screens
                  </p>
                </div>
              </div>
            </div>

            {/* Developer Notes */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-8 space-y-4">
              <h2 className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                🔧 Developer Notes
              </h2>
              
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>
                  <strong>LocalStorage Keys:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">authRedirectUrl</code> - Stores redirect URL after auth</li>
                    <li>• <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">ehcf_user_location</code> - Stores geolocation data</li>
                  </ul>
                </li>
                <li>
                  <strong>API Endpoints Used:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">getProfileByUUID(userId)</code></li>
                    <li>• <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">createProfile</code></li>
                    <li>• <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">updateProfileByUUID(userId)</code></li>
                  </ul>
                </li>
                <li>
                  <strong>Environment Variables:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">VITE_PUBLIC_IP_INFO_TOKEN</code> - IPInfo.io API token</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sign-In Modal */}
      <SignIn 
        isOpen={signInOpen} 
        onClose={() => setSignInOpen(false)}
        redirectUrl="/testing"
      />
    </div>
  );
}