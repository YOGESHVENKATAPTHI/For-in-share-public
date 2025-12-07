import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Github, Mail, Heart } from "lucide-react";
import { Logo } from "@/components/logo";

export function AppFooter() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800 relative overflow-hidden">
      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 opacity-80"></div>
      
      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <Logo className="h-6 sm:h-8 w-auto invert flex-shrink-0" />
              <span className="text-xl font-bold tracking-tight text-white">
                ForInShare.
              </span>
            </div>
            <p className="text-zinc-500 max-w-sm leading-relaxed">
              A minimal space for communities to thrive. Share files, discuss ideas, and build together without the noise.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a 
                href="https://github.com/YOGESHVENKATAPTHI" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-lg"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="mailto:yogeshvenkatapathy@outlook.com"
                className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-lg"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-200">Platform</h4>
            <ul className="space-y-2">
              
              <li>
                <Link href="/contact">
                  <a className="text-zinc-500 hover:text-white transition-colors">Contact</a>
                </Link>
              </li>
              <li>
                <Link href="/my-space">
                  <a className="text-zinc-500 hover:text-white transition-colors">My Space</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-200">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy">
                  <a className="text-zinc-500 hover:text-white transition-colors">Privacy Policy</a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-zinc-500 hover:text-white transition-colors">Terms of Service</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} ForInShare. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-sm text-zinc-600">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-red-500 fill-current" />
            <span>by Yogesh</span>
          </div>
        </div>
      </div>
      
      {/* Background Gradient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>
    </footer>
  );
}
