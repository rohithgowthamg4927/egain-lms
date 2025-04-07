
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, User } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Role } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const LoginForm = () => {
  const [email, setEmail] = useState("admin@lms.com");
  const [password, setPassword] = useState("Admin@123");
  const [role, setRole] = useState<Role>(Role.admin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      console.log("Attempting login with:", { email, password, role });
      
      // Add some debugging output
      const authToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('currentUser');
      console.log("Before login - Auth token exists:", !!authToken);
      console.log("Before login - User exists:", !!storedUser);
      
      const success = await login(email, password, role);
      
      if (success) {
        console.log("Login successful, redirecting to dashboard from form");
        toast({
          title: "Login successful",
          description: "Welcome to the LMS system",
        });
        
        // Force navigation to dashboard
        setTimeout(() => {
          const user = localStorage.getItem('currentUser');
          console.log("User in localStorage after login:", user);
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        console.log("Login failed");
        setErrorMessage("Invalid credentials. Please check your email, password, and role.");
        toast({
          title: "Login failed",
          description: "Please check your credentials and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : 'Failed to connect to server';
      setErrorMessage(message);
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center items-center">
            <div className="text-indigo-600 text-2xl font-bold mb-1">e</div>
            <div className="text-indigo-600 text-2xl font-bold">gain</div>
          </div>
          <h2 className="text-3xl font-bold mt-4 text-gray-800">Welcome Back! 👋</h2>
          <p className="text-gray-600 mt-2">
            Please sign in to your account and start the adventure
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 pl-10 bg-white border-gray-300 text-gray-900"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 pr-10 bg-white border-gray-300 text-gray-900"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-700">Select Role</Label>
            <RadioGroup
              defaultValue="admin"
              value={role}
              onValueChange={(value) => setRole(value as Role)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="cursor-pointer text-gray-700">Admin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="instructor" id="instructor" />
                <Label htmlFor="instructor" className="cursor-pointer text-gray-700">Instructor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student" className="cursor-pointer text-gray-700">Student</Label>
              </div>
            </RadioGroup>
          </div>
          
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
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
      </div>
    </div>
  );
};

export default LoginForm;
