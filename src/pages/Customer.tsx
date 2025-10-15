import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, BedDouble, UtensilsCrossed, Sparkles, Crown } from "lucide-react";
import { RoomBooking } from "@/components/customer/RoomBooking";
import { ServiceRequests } from "@/components/customer/ServiceRequests";
import { MyRequests } from "@/components/customer/MyRequests";
import { MyBills } from "@/components/customer/MyBills";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<'profiles'>;

const Customer = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?role=customer');
        return;
      }

      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (role?.role !== 'customer') {
        toast.error("Access denied");
        navigate('/');
        return;
      }

      setUser(session.user);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(profileData);
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="bg-gradient-primary text-primary-foreground p-6 shadow-elegant">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Royal Hostel</h1>
              <p className="text-sm opacity-90">Welcome, {profile?.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/30">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card shadow-elegant">
            <TabsTrigger value="rooms">
              <BedDouble className="w-4 h-4 mr-2" />
              Book Room
            </TabsTrigger>
            <TabsTrigger value="services">
              <Sparkles className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="requests">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              My Requests
            </TabsTrigger>
            <TabsTrigger value="bills">
              Bills
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms">
            <RoomBooking userId={user.id} />
          </TabsContent>

          <TabsContent value="services">
            <ServiceRequests userId={user.id} />
          </TabsContent>

          <TabsContent value="requests">
            <MyRequests userId={user.id} />
          </TabsContent>

          <TabsContent value="bills">
            <MyBills userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Customer;
