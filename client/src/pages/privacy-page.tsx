import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/app-footer";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";

export default function PrivacyPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 supports-[backdrop-filter]:bg-zinc-950/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setLocation("/")}>
              <div className="relative">
                <div className="absolute inset-0 bg-zinc-100 blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                <Logo className="h-6 sm:h-8 w-auto invert flex-shrink-0 relative z-10" />
              </div>
              <span className="text-lg font-bold text-zinc-100 tracking-tight group-hover:text-white transition-colors">ForInShare</span>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 rounded-full px-6 transition-all duration-300"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-zinc-900 border-b border-zinc-800 py-20 sm:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.15] animate-whirlpool origin-center pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at center, #52525b 1px, transparent 1px)', 
            backgroundSize: '30px 30px'
          }}
        ></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-100 mb-8 tracking-tighter">
            Privacy Policy
          </h1>
          <p className="text-xl sm:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </p>
          <div className="mt-12 inline-block border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm px-6 py-2 rounded-full">
            <p className="text-sm text-zinc-500 font-mono">
              Last updated: December 7, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-4xl">
        <div className="space-y-16 sm:space-y-24 text-zinc-300 leading-relaxed">
          
          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">01</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                Information We Collect
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2 space-y-6">
              <p className="text-lg text-zinc-400 leading-relaxed">
                We collect information you provide directly to us, such as when you create an account, update your profile, post content, or communicate with us. This may include:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-500">
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                  Account information
                </li>
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                  Profile information
                </li>
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                  Content you create
                </li>
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                  Files you upload
                </li>
              </ul>
            </div>
          </section>

          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">02</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                How We Use Your Information
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2 space-y-6">
              <p className="text-lg text-zinc-400 leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, such as to:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-500">
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                  Maintain your account
                </li>
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                  Display your content
                </li>
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                  Send updates & support
                </li>
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></span>
                  Prevent fraud
                </li>
              </ul>
            </div>
          </section>

          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">03</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                Data Storage and Security
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2">
              <p className="text-lg text-zinc-400 leading-relaxed mb-4">
                We use industry-standard security measures to protect your information. Your data is stored on secure servers, and we use encryption to protect sensitive information transmitted online. However, no method of transmission over the Internet or method of electronic storage is 100% secure.
              </p>
              <p className="text-lg text-zinc-400 leading-relaxed">
                We utilize distributed storage systems including Neon Database and Dropbox for efficient and reliable data management.
              </p>
            </div>
          </section>

          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">04</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                Sharing of Information
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2 space-y-6">
              <p className="text-lg text-zinc-400 leading-relaxed">
                We do not share your personal information with third parties except as described in this policy. We may share your information with:
              </p>
              <ul className="grid grid-cols-1 gap-4 text-zinc-500">
                <li className="flex items-start gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full mt-2.5"></span>
                  <span className="flex-1">Service providers who perform services on our behalf.</span>
                </li>
                <li className="flex items-start gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full mt-2.5"></span>
                  <span className="flex-1">In response to a request for information if we believe disclosure is in accordance with any applicable law, regulation, or legal process.</span>
                </li>
                <li className="flex items-start gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full mt-2.5"></span>
                  <span className="flex-1">If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of ForInShare or others.</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">05</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                Your Choices
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2">
              <p className="text-lg text-zinc-400 leading-relaxed">
                You may update, correct, or delete your account information at any time by logging into your account settings. You may also contact us to request the deletion of your personal information.
              </p>
            </div>
          </section>

          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">06</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                Cookies
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2">
              <p className="text-lg text-zinc-400 leading-relaxed">
                We use cookies and similar technologies to collect information about your activity, browser, and device. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>
            </div>
          </section>

          <section className="pt-16 border-t border-zinc-900">
            <div className="bg-zinc-900/30 border border-zinc-900 p-8 sm:p-12 text-center rounded-2xl">
              <h3 className="text-2xl font-bold text-zinc-100 mb-4">Still have questions?</h3>
              <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                If you have any questions about this Privacy Policy, please contact our support team. We're here to help you understand how we protect your data.
              </p>
              <a 
                href="mailto:yogeshvenkatapathy@outlook.com" 
                className="inline-flex items-center justify-center px-8 py-4 bg-zinc-100 text-zinc-950 font-bold hover:bg-white transition-colors rounded-full"
              >
                Contact Privacy Team
              </a>
            </div>
          </section>

        </div>
      </main>

      <AppFooter />
    </div>
  );
}
