import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type ServiceRequest = Tables<'service_requests'> & {
  services: { name: string } | null;
  profiles: { full_name: string } | null;
};

export const AllRequests = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('service_requests').select('*, services(name), profiles(full_name)');
      setRequests(data || []);
    };
    fetch();
  }, []);

  return <div className="space-y-6"><h2 className="text-2xl font-bold">All Requests</h2>
    <div className="grid gap-4">{requests.map((r) => <Card key={r.id} className="p-6"><div className="flex justify-between"><div><h3 className="font-semibold">{r.services?.name}</h3><p className="text-sm text-muted-foreground">{r.profiles?.full_name}</p></div><Badge>{r.status}</Badge></div></Card>)}</div>
  </div>;
};
