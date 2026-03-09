import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Mail, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetStatus = "idle" | "success" | "error";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
  onEmailChange?: (email: string) => void;
  onResetPassword: (email: string) => Promise<void>;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({
  open,
  onOpenChange,
  initialEmail = "",
  onEmailChange,
  onResetPassword,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<ResetStatus>("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(initialEmail);
      setStatus("idle");
      setMessage("");
    }
  }, [open, initialEmail]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    onEmailChange?.(value);
  };

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Enter your email address first.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("idle");
      setMessage("");
      await onResetPassword(normalizedEmail);
      setStatus("success");
      setMessage(`Reset link sent to ${normalizedEmail}. Check inbox, spam, and promotions.`);
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Failed to send password reset email."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-none p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 px-6 py-5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-full bg-white/20 p-2">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl">Reset your password</DialogTitle>
              <DialogDescription className="text-blue-100">
                We will email you a secure reset link.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="bg-card px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-foreground">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => handleEmailChange(event.target.value)}
                className="pl-10"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
          </div>

          {status !== "idle" && message && (
            <div
              className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <div className="flex items-start gap-2">
                {status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <p>{message}</p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-5 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
