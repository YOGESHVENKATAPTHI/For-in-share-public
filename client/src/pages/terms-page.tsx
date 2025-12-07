import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/app-footer";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-xl sm:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
            Please read these terms carefully before using our platform. By using ForInShare, you agree to be bound by these terms.
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
                Acceptance of Terms
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2">
              <p className="text-lg text-zinc-400 leading-relaxed">
                By accessing and using ForInShare ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </div>
          </section>

          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">02</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                Description of Service
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2">
              <p className="text-lg text-zinc-400 leading-relaxed">
                ForInShare provides users with access to a rich collection of resources, including various communications tools, forums, shopping services, and personalized content through its network of properties. You understand and agree that the Service may include advertisements and that these advertisements are necessary for ForInShare to provide the Service.
              </p>
            </div>
          </section>

          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">03</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                User Conduct
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2 space-y-6">
              <p className="text-lg text-zinc-400 leading-relaxed">
                You agree to use the Service only for lawful purposes. You are prohibited from posting on or transmitting through the Service any material that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, sexually explicit, profane, hateful, racially, ethnically, or otherwise objectionable of any kind.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-500">
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                  Do not upload malicious code
                </li>
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                  Do not harass or bully others
                </li>
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                  Respect intellectual property
                </li>
                <li className="flex items-center gap-3 bg-zinc-900/50 p-4 border border-zinc-900 hover:border-zinc-800 transition-colors">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                  No illegal file sharing
                </li>
              </ul>
            </div>
          </section>

          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">04</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                Intellectual Property
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2">
              <p className="text-lg text-zinc-400 leading-relaxed">
                The content, organization, graphics, design, compilation, magnetic translation, digital conversion and other matters related to the Site are protected under applicable copyrights, trademarks and other proprietary (including but not limited to intellectual property) rights. The copying, redistribution, use or publication by you of any such matters or any part of the Site is strictly prohibited.
              </p>
            </div>
          </section>

          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">05</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                Termination
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2">
              <p className="text-lg text-zinc-400 leading-relaxed">
                We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
              </p>
            </div>
          </section>

          <section className="group">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-4xl font-bold text-zinc-800 group-hover:text-zinc-700 transition-colors">06</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
                Changes to Terms
              </h2>
            </div>
            <div className="pl-0 sm:pl-14 border-l-2 border-zinc-900 group-hover:border-zinc-800 transition-colors py-2">
              <p className="text-lg text-zinc-400 leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </div>
          </section>

          <section className="pt-16 border-t border-zinc-900">
            <div className="bg-zinc-900/30 border border-zinc-900 p-8 sm:p-12 text-center rounded-2xl">
              <h3 className="text-2xl font-bold text-zinc-100 mb-4">Still have questions?</h3>
              <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                If you have any questions about these Terms, please contact our support team. We're here to help you understand our policies.
              </p>
              <a 
                href="mailto:yogeshvenkatapathy@outlook.com" 
                className="inline-flex items-center justify-center px-8 py-4 bg-zinc-100 text-zinc-950 font-bold hover:bg-white transition-colors rounded-full"
              >
                Contact Support
              </a>
            </div>
          </section>

        </div>
      </main>

      <AppFooter />
    </div>
  );
}
