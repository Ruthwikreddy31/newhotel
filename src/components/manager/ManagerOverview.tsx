import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const ManagerOverview = () => {
  const [stats, setStats] = useState({ bookings: 0, requests: 0, revenue: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { count: bookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
      const { count: requests } = await supabase.from('service_requests').select('*', { count: 'exact', head: true });
      const { data: bills } = await supabase.from('bills').select('total_amount');
      setStats({ bookings: bookings || 0, requests: requests || 0, revenue: bills?.reduce((s, b) => s + Number(b.total_amount), 0) || 0 });
    };
    fetch();
  }, []);

  return <div className="grid md:grid-cols-3 gap-6">
    <Card className="p-6"><h3 className="text-lg font-semibold">Total Bookings</h3><p className="text-3xl font-bold text-accent mt-2">{stats.bookings}</p></Card>
    <Card className="p-6"><h3 className="text-lg font-semibold">Service Requests</h3><p className="text-3xl font-bold text-accent mt-2">{stats.requests}</p></Card>
    <Card className="p-6"><h3 className="text-lg font-semibold">Total Revenue</h3><p className="text-3xl font-bold text-accent mt-2">${stats.revenue}</p></Card>
  </div>;
};
