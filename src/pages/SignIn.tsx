import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

const SignIn = () => {
  const navigate = useNavigate();
  const { signIn, loading, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sign in. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || authError;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="font-display text-2xl font-bold text-foreground">StoryForge</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue writing</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {displayError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || loading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading || loading}
              >
                {isLoading || loading ? "Signing In..." : "Sign In"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign Up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
