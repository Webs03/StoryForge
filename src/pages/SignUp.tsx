import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp, loading, error: authError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      await signUp(email, password, name);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again."
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
            <CardTitle className="font-display text-2xl">Create Your Account</CardTitle>
            <CardDescription>Start your writing journey today</CardDescription>
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
                <Label htmlFor="name">User Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g Chisomo Banda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading || loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {isLoading || loading ? "Creating Account..." : "Create Account"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link to="/signin" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
