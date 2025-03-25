
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, User } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Role } from "@/lib/types";

const LoginForm = () => {
  const [email, setEmail] = useState("admin@lms.com");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.admin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await login(email, password, role);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-card">
      <CardHeader className="space-y-2">
        <div className="flex justify-center items-center">
          <div className="text-indigo-600 text-2xl font-bold mb-1">e</div>
          <div className="text-indigo-600 text-2xl font-bold">gain</div>
        </div>
        <CardTitle className="text-3xl font-bold text-center">Welcome Back! 👋</CardTitle>
        <p className="text-center text-muted-foreground">
          Please sign in to your account and start the adventure
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 pl-10 bg-muted/40"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 pr-10 bg-muted/40"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Select Role</Label>
            <RadioGroup
              defaultValue="admin"
              value={role}
              onValueChange={(value) => setRole(value as Role)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="cursor-pointer">Admin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="instructor" id="instructor" />
                <Label htmlFor="instructor" className="cursor-pointer">Instructor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student" className="cursor-pointer">Student</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button
            type="submit"
            className="w-full h-11 bg-blue-500 hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
