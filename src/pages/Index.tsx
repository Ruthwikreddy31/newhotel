import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Users, Wrench } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [forceAuth, setForceAuth] = useState(false);

  useEffect(() => {
    // Check if user wants to force auth (e.g., from URL parameter)
    const forceAuthParam = searchParams.get('forceAuth');
    if (forceAuthParam === 'true') {
      setForceAuth(true);
      setLoading(false);
      return;
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !forceAuth) {
        try {
          // Check user role and redirect
          const { data: roles, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          if (roles && !roleError) {
            // User has a role, redirect to appropriate dashboard
            if (roles.role === 'customer') navigate('/customer');
            else if (roles.role === 'worker') navigate('/worker');
            else if (roles.role === 'manager') navigate('/manager');
          } else {
            // User is logged in but has no role - show role selection
            console.log('User logged in but no role assigned');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
      setLoading(false);
    };
    
    checkUser();
  }, [navigate, searchParams, forceAuth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setForceAuth(false);
    window.location.reload();
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16">
        {/* Add logout button if user is logged in */}
        {forceAuth && (
          <div className="text-center mb-8">
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/30"
            >
              Logout & Start Fresh
            </Button>
          </div>
        )}
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <Crown className="w-16 h-16 mx-auto mb-4 text-accent" />
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Royal Hostel
          </h1>
          <p className="text-xl text-muted-foreground">
            Experience Luxury & Comfort
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 shadow-elegant hover:shadow-gold transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => navigate('/auth?role=customer&force=true')}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-gold rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Customer</h2>
              <p className="text-muted-foreground">Book rooms and enjoy premium services</p>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Guest Login
              </Button>
            </div>
          </Card>

          <Card className="p-8 shadow-elegant hover:shadow-gold transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => navigate('/auth?role=worker&force=true')}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-gold rounded-full flex items-center justify-center">
                <Wrench className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Worker</h2>
              <p className="text-muted-foreground">Manage tasks and serve customers</p>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Staff Login
              </Button>
            </div>
          </Card>

          <Card className="p-8 shadow-elegant hover:shadow-gold transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => navigate('/auth?role=manager&force=true')}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-gold rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Manager</h2>
              <p className="text-muted-foreground">Oversee operations and analytics</p>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Admin Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
