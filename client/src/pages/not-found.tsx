import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950">
      <Card className="w-full max-w-lg mx-4 bg-zinc-900 border-zinc-800">
        <CardContent className="pt-12 pb-8">
          <div className="text-center">
            <div className="mb-8">
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-none mx-auto w-fit mb-6">
                <Logo className="h-12 w-12" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-100 mb-2">Page Not Found</h1>
              <p className="text-lg text-zinc-400">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-0 px-6 py-3 rounded-none font-semibold"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
