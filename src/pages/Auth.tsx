import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Crown } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'customer';
  const force = searchParams.get('force') === 'true';
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      // If force=true, skip the session check and show auth form
      if (force) {
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const { data: userRole, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          if (roleError || !userRole) {
            console.log('No role found, redirecting to role selection');
            // If no role found, redirect to home page to select role
            navigate('/');
            return;
          }

          // Direct navigation to appropriate dashboard
          if (userRole.role === 'customer') window.location.href = '/customer';
          else if (userRole.role === 'worker') window.location.href = '/worker';
          else if (userRole.role === 'manager') window.location.href = '/manager';
        } catch (error) {
          console.error('Error checking user role:', error);
          navigate('/');
        }
      }
    };
    checkUser();
  }, [navigate, force]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Wait a moment for the session to be fully established
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { data: userRole, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

          if (roleError || !userRole) {
            console.error('Role fetch error:', roleError);
            toast.error("No role assigned to this user. Please contact support.");
            return;
          }

          // Direct navigation to dashboard
          toast.success("Login successful! Redirecting to dashboard...");
          
          if (userRole.role === 'customer') window.location.href = '/customer';
          else if (userRole.role === 'worker') window.location.href = '/worker';
          else if (userRole.role === 'manager') window.location.href = '/manager';
          else toast.error("Invalid role assigned to this user");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        if (data.user) {
          // Wait for profile to be created by trigger
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Insert user role with error handling
          const { error: roleError } = await supabase.rpc('create_user_with_role', {
            user_id: data.user.id,
            user_role: role,
          });

          if (roleError) {
            console.error('Role assignment error:', roleError);
            toast.error("Account created but role assignment failed. Please contact support.");
            return;
          }

          toast.success("Account created! Redirecting to dashboard...");
          
          // Direct navigation to appropriate dashboard
          if (role === 'customer') window.location.href = '/customer';
          else if (role === 'worker') window.location.href = '/worker';
          else if (role === 'manager') window.location.href = '/manager';
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        {/* Show logout button if user is already logged in */}
        {force && (
          <div className="text-center mb-4">
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border-white/30"
            >
              Logout Current User
            </Button>
          </div>
        )}
        <div className="text-center mb-8">
          <Crown className="w-12 h-12 mx-auto mb-4 text-accent" />
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </h1>
          <p className="text-muted-foreground mt-2 capitalize">
            {role} {isLogin ? 'Login' : 'Registration'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-accent hover:underline font-medium"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </button>
        </form>
      </Card>
    </div>
  );
};

export default Auth;