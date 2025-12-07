import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppFooter } from "@/components/app-footer";
import { 
  MessageSquare, ArrowLeft, Database, Cloud, Lock, 
  Zap, Users, FileText, Globe, Info, Target, 
  ArrowRight, ExternalLink
} from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      icon: Lock,
      title: "Public & Private Forums",
      description: "Create open forums for everyone or private invite-only spaces with access control",
    },
    {
      icon: Zap,
      title: "Real-time Chat",
      description: "WebSocket-based instant messaging with live updates across all connected users",
    },
    {
      icon: FileText,
      title: "Advanced File Management",
      description: "Upload/download with real-time progress indicators showing MB transferred",
    },
    {
      icon: Users,
      title: "Member Management",
      description: "Forum creators can invite users or approve/reject access requests with role assignments",
    },
    {
      icon: Globe,
      title: "Responsive Design",
      description: "Optimized for mobile, tablet, and desktop devices with professional UI/UX",
    },
  ];

  const techStack = [
    { category: "Frontend", items: ["React", "TypeScript", "Tailwind CSS", "Shadcn UI", "TanStack Query"] },
    { category: "Backend", items: ["Express.js", "WebSocket", "Passport.js", "Drizzle ORM"] },
    { category: "Storage", items: ["PostgreSQL (Neon)", "Multi-instance Sharding"] },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Modern Header with Glass Effect */}
      <header className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-18 items-center justify-between">
            {/* Enhanced Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="bg-zinc-900 border border-zinc-800 p-2.5 sm:p-3">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-100" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-zinc-100">
                  ForInShare
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 hidden sm:block">
                  About Us
                </p>
              </div>
            </div>

            {/* Desktop Navigation - Enhanced */}
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/contact">
                <Button variant="ghost" className="gap-2 px-4 py-2 rounded-none text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900">
                  Contact
                </Button>
              </Link>
              <Link href="/">
                <Button className="gap-2 px-6 py-2 rounded-none bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>

            {/* Mobile Navigation - Enhanced */}
            <div className="flex lg:hidden items-center gap-2">
              <Link href="/contact">
                <Button variant="ghost" size="sm" className="px-3 py-2 rounded-none text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900">
                  Contact
                </Button>
              </Link>
              <Link href="/">
                <Button size="sm" className="h-10 w-10 p-0 rounded-none bg-zinc-100 text-zinc-950 hover:bg-zinc-200" aria-label="Back to home">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden bg-zinc-900 border-b border-zinc-800">
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Enhanced Title */}
            <div className="mb-6 sm:mb-8">
              <div className="inline-block p-3 sm:p-4 bg-zinc-950 border border-zinc-800 mb-6">
                <div className="flex items-center gap-3 text-zinc-100">
                  <Info className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span className="text-sm sm:text-base font-medium">About Us</span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 text-zinc-100">
                About ForInShare
              </h1>
            </div>

            {/* Enhanced Description */}
            <div className="space-y-4 sm:space-y-6">
              <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 leading-relaxed">
                A professional-grade collaborative platform featuring real-time chat forums and 
                distributed file storage with intelligent sharding across clustered cloud infrastructure.
              </p>
              <p className="text-base sm:text-lg text-zinc-500 max-w-3xl mx-auto">
                We're transforming how communities share knowledge, collaborate on projects, and build meaningful connections through innovative technology and intuitive design.
              </p>
            </div>

            {/* Mission Statement Card */}
            <div className="mt-8 sm:mt-12 max-w-2xl mx-auto">
              <div className="bg-zinc-950 border border-zinc-800 p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-zinc-100" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-zinc-100">Our Mission</h3>
                <p className="text-zinc-400">
                  To create the most intuitive and powerful platform for community-driven file sharing and discussions, 
                  empowering users to collaborate seamlessly across all devices.
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-8 sm:mt-12">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="w-full sm:w-auto gap-2 px-6 py-3 rounded-none bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
                    Get in Touch
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 px-6 py-3 rounded-none border-zinc-800 text-zinc-100 hover:bg-zinc-800">
                    Explore Platform
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Grid */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-zinc-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block p-3 bg-zinc-900 border border-zinc-800 mb-6">
              <Zap className="h-6 w-6 text-zinc-100" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-zinc-100">
              Key Features
            </h2>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto">
              Built with modern technologies and enterprise-grade architecture for seamless collaboration
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8"
                >
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-zinc-100" />
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-zinc-100">
                      {feature.title}
                    </h3>
                    <p className="text-zinc-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Technical Architecture Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-zinc-900 border-t border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block p-3 bg-zinc-950 border border-zinc-800 mb-6">
              <Database className="h-6 w-6 text-zinc-100" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-zinc-100">
              Technical Architecture
            </h2>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto">
              Built with a scalable, distributed architecture designed for reliability and performance
            </p>
          </div>

          {/* Tech Stack Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-12 sm:mb-16">
            {techStack.map((stack, index) => {
              const icons = [Cloud, Zap, Database];
              const Icon = icons[index];
              return (
                <div 
                  key={index} 
                  className="bg-zinc-950 border border-zinc-800 p-6 sm:p-8 text-center"
                >
                  {/* Category Icon */}
                  <div className="relative mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-zinc-100" />
                    </div>
                  </div>

                  {/* Category Title */}
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-zinc-100">
                    {stack.category}
                  </h3>

                  {/* Tech Items */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                    {stack.items.map((item, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-none bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          
        </div>
      </section>

      {/* Enhanced CTA Section */}
           <AppFooter />
    </div>
  );
}
