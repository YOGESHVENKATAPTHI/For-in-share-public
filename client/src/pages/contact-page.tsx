import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppFooter } from "@/components/app-footer";
import { 
  MessageSquare, ArrowLeft, Mail, Github, Linkedin, 
  Globe, GraduationCap, Code, Building, Send
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("idle");
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus("error");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus("error");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const mailtoLink = `${contactInfo.email}?subject=Contact from ${formData.name}&body=${encodeURIComponent(formData.message + "\n\nFrom: " + formData.name + "\nEmail: " + formData.email)}`;
      window.location.href = mailtoLink;
      
      setTimeout(() => {
        setSubmitStatus("success");
        setIsSubmitting(false);
        setFormData({ name: "", email: "", message: "" });
      }, 1000);
    } catch (error) {
      setSubmitStatus("error");
      setIsSubmitting(false);
    }
  };

  const contactInfo = {
    name: "Yogesh V",
    role: "Full Stack Developer",
    education: "3rd Year Computer Science Engineering",
    institution: "Sri Sairam Institute of Technology",
    email: "mailto:yogeshvenkatapathy@outlook.com",
    links: [
      {
        icon: Github,
        label: "GitHub",
        url: "https://github.com/YOGESHVENKATAPTHI",
        username: "@Yogesh Venkatapathy",
      },
      {
        icon: Linkedin,
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/yogeshvenkatapathy/",
        username: "Yogesh Venkatapathy",
      },
      {
        icon: Globe,
        label: "Portfolio",
        url: "https://devyogesh.onrender.com",
        username: "devyogesh.onrender.com",
      },
    ],
  };

  const skills = [
    "React", "Next.js", "TypeScript", "Node.js", "Express", 
    "PostgreSQL", "WebSockets", "Tailwind CSS"
  ];

  const projects = [
    {
      name: "ForInShare",
      description: "Real-time collaborative platform with distributed storage architecture",
      tech: ["React", "Express", "PostgreSQL", "WebSocket"],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
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
                  Contact Us
                </p>
              </div>
            </div>

            {/* Desktop Navigation - Enhanced */}
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/about">
                <Button variant="ghost" className="gap-2 px-4 py-2 rounded-none text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900">
                  About
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
              <Link href="/about">
                <Button variant="ghost" size="sm" className="px-3 py-2 rounded-none text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900">
                  About
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
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8" />
                  <span className="text-sm sm:text-base font-medium">Get in Touch</span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 text-zinc-100">
                Contact Us
              </h1>
            </div>

            {/* Enhanced Description */}
            <div className="space-y-4 sm:space-y-6">
              <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 leading-relaxed">
                Have questions or feedback? Feel free to reach out!
              </p>
              <p className="text-base sm:text-lg text-zinc-500 max-w-3xl mx-auto">
                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Info Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-zinc-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Developer Profile Card */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 mb-8 sm:mb-12">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 mb-8">
                <div className="relative">
                  
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-zinc-100">
                    {contactInfo.name}
                  </h2>
                  <p className="text-lg sm:text-xl text-zinc-400 mb-4">
                    {contactInfo.role}
                  </p>
                  
                  {/* Education Badge */}
                  <div className="inline-flex items-center gap-3 p-3 sm:p-4 bg-zinc-950 border border-zinc-800">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-100" />
                    <div>
                      <p className="font-semibold text-sm sm:text-base text-zinc-100">{contactInfo.education}</p>
                      <p className="text-xs sm:text-sm text-zinc-400">{contactInfo.institution}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Email */}
              <div className="mb-8">
                <div className="flex items-center gap-4 p-4 sm:p-6 bg-zinc-950 border border-zinc-800">
                  <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-zinc-100" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-400 mb-1">Email me directly</p>
                    <a 
                      href={`${contactInfo.email}`}
                      className="text-lg sm:text-xl font-semibold text-zinc-100 hover:underline transition-colors"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-zinc-100">Connect with me</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {contactInfo.links.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-zinc-950 border border-zinc-800 p-4 sm:p-6 hover:bg-zinc-900 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                            <Icon className="h-6 w-6 text-zinc-100" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-base text-zinc-100 group-hover:text-zinc-300 transition-colors">{link.label}</p>
                            <p className="text-xs sm:text-sm text-zinc-400 truncate">
                              {link.username}
                            </p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Skills & Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Skills Card */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-100">Technical Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {skills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="px-3 py-1.5 text-sm font-medium rounded-none bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 cursor-default"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

       
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Form Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-zinc-900 border-t border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-12">
              {/* <div className="inline-block p-3 bg-zinc-950 border border-zinc-800 mb-6">
                <Send className="h-6 w-6 text-zinc-100" />
              </div> */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-zinc-100">
                Send a Message
              </h2>
              <p className="text-lg sm:text-xl text-zinc-400">
                Fill out the form below or email me directly at{" "}
                <a href={`${contactInfo.email}`} className="text-zinc-100 hover:underline font-medium">
                  {contactInfo.email}
                </a>
              </p>
            </div>

            {/* Enhanced Form */}
            <div className="bg-zinc-950 border border-zinc-800 p-6 sm:p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Name Field */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2 text-zinc-300">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-12 sm:h-14 text-base bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-700 rounded-none"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2 text-zinc-300">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12 sm:h-14 text-base bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-700 rounded-none"
                  />
                </div>

                {/* Message Field */}
                <div className="space-y-3">
                  <Label htmlFor="message" className="text-base font-semibold flex items-center gap-2 text-zinc-300">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell me about your project, questions, or how we can work together..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    className="resize-none text-base bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-700 rounded-none"
                  />
                </div>

                {/* Status Messages */}
                {submitStatus === "success" && (
                  <div className="p-4 sm:p-6 bg-green-900/20 border border-green-900/30 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center">
                        <Send className="h-4 w-4 text-green-100" />
                      </div>
                      <p className="text-sm sm:text-base text-green-400 font-medium">
                        Your email client should now open. Thank you for reaching out!
                      </p>
                    </div>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="p-4 sm:p-6 bg-red-900/20 border border-red-900/30 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-sm sm:text-base text-red-400 font-medium">
                      Please fill in all fields with valid information.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.message.trim()}
                  className="w-full gap-3 px-8 py-4 text-lg font-semibold rounded-none bg-zinc-100 text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>Preparing your message...</>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
