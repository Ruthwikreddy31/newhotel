import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Worker = Tables<'user_roles'> & {
  profiles: Tables<'profiles'> | null;
};

export const WorkerManagement = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('user_roles').select('*, profiles(*)').eq('role', 'worker');
      setWorkers(data || []);
    };
    fetch();
  }, []);

  return <div className="space-y-6"><h2 className="text-2xl font-bold">Workers</h2>
    <div className="grid gap-4">{workers.map((w) => <Card key={w.id} className="p-6"><p className="font-semibold">{w.profiles?.full_name}</p><p className="text-sm text-muted-foreground">{w.profiles?.email}</p></Card>)}</div>
  </div>;
};
