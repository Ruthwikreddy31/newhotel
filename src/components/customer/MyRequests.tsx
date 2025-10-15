import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

type ServiceRequest = Tables<'service_requests'> & {
  services: { name: string } | null;
};

export const MyRequests = ({ userId }: { userId: string }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase.from('service_requests').select('*, services(name)').eq('customer_id', userId).order('created_at', { ascending: false });
    setRequests(data || []);
  }, [userId]);

  useEffect(() => {
    fetchRequests();
    const channel = supabase.channel('requests').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'service_requests', filter: `customer_id=eq.${userId}` },
      () => fetchRequests()
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchRequests]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Service Requests</h2>
      <div className="grid gap-4">
        {requests.map((req) => (
          <Card key={req.id} className="p-6">
            <div className="flex justify-between items-start">
              <div><h3 className="font-semibold">{req.services?.name}</h3><p className="text-sm text-muted-foreground mt-2">{req.customer_notes}</p></div>
              <Badge>{req.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
