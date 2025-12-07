import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Upload, Lock, Users } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loginMutation, registerMutation } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({
        username: formData.username,
        password: formData.password,
      });
    } else {
      registerMutation.mutate(formData);
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-950">
      {/* Left side - Enhanced Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-zinc-950 relative overflow-hidden">
        
        <div className="w-full max-w-lg relative z-10">
          <div className="bg-transparent p-6 sm:p-8 lg:p-10">
            {/* Enhanced Logo/Brand */}
            <div className="mb-12">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-2 text-zinc-100 uppercase">
                ForInShare
              </h1>
              <div className="h-1 w-24 bg-zinc-100 mb-8"></div>
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-zinc-100">
                {isLogin ? "Welcome back." : "Join the network."}
              </h2>
              <p className="text-base text-zinc-500 font-medium">
                {isLogin
                  ? "Enter your credentials to access the secure area."
                  : "Create an account to start collaborating."}
              </p>
            </div>

            {/* Enhanced Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Username Field */}
              <div className="space-y-2 group">
                <Label htmlFor="username" className="text-xs uppercase tracking-widest font-bold text-zinc-500 group-focus-within:text-zinc-100 transition-colors">
                  Username
                </Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="h-12 text-lg bg-transparent border-0 border-b-2 border-zinc-800 text-zinc-100 focus:border-zinc-100 focus:ring-0 rounded-none px-0 transition-all placeholder:text-zinc-800"
                  placeholder="USERNAME"
                  autoComplete="username"
                />
              </div>

              {/* Email Field - Only for Sign Up */}
              {!isLogin && (
                <div className="space-y-2 group animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-zinc-500 group-focus-within:text-zinc-100 transition-colors">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12 text-lg bg-transparent border-0 border-b-2 border-zinc-800 text-zinc-100 focus:border-zinc-100 focus:ring-0 rounded-none px-0 transition-all placeholder:text-zinc-800"
                    placeholder="EMAIL@EXAMPLE.COM"
                    autoComplete="email"
                  />
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2 group">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest font-bold text-zinc-500 group-focus-within:text-zinc-100 transition-colors">
                  Password
                </Label>
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-12 text-lg bg-transparent border-0 border-b-2 border-zinc-800 text-zinc-100 focus:border-zinc-100 focus:ring-0 rounded-none px-0 transition-all placeholder:text-zinc-800"
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                data-testid="button-submit"
                size="lg"
                className="w-full h-14 text-lg font-bold uppercase tracking-wider rounded-none bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-[1.01] transition-all active:scale-[0.99]"
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  isLogin ? "Sign In" : "Create Account"
                )}
              </Button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="mt-12 pt-6 border-t border-zinc-900 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-zinc-500 hover:text-zinc-100 transition-colors uppercase tracking-wider font-medium"
                data-testid="button-toggle-auth"
              >
                {isLogin ? "Need an account? " : "Have an account? "}
                <span className="text-zinc-100 border-b border-zinc-500 hover:border-zinc-100 pb-0.5 ml-1">
                  {isLogin ? "Register" : "Login"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Right side - Hero */}
      <div className="hidden lg:flex flex-1 bg-zinc-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 opacity-20">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950 animate-subtle-pulse"></div>
           <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(45deg, #18181b 25%, transparent 25%, transparent 75%, #18181b 75%, #18181b), linear-gradient(45deg, #18181b 25%, transparent 25%, transparent 75%, #18181b 75%, #18181b)', backgroundSize: '60px 60px', backgroundPosition: '0 0, 30px 30px', opacity: 0.1 }}></div>
        </div>

        <div className="max-w-2xl text-zinc-100 relative z-10">
          <div className="mb-8 border-l-4 border-zinc-100 pl-8">
            <h1 className="text-6xl lg:text-7xl font-black mb-6 text-zinc-100 tracking-tighter leading-none">
              CONNECT<br/>
              SHARE<br/>
              BUILD
            </h1>
            <p className="text-xl lg:text-2xl text-zinc-400 leading-relaxed font-light max-w-md">
              A minimalist platform for focused collaboration. No distractions. Just you and your community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
