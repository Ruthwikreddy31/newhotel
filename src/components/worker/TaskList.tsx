import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<'service_requests'> & {
  services: { name: string } | null;
  profiles: { full_name: string } | null;
};

export const TaskList = ({ userId }: { userId: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase.from('service_requests').select('*, services(name), profiles(full_name)').or(`worker_id.eq.${userId},status.eq.pending`);
    setTasks(data || []);
  }, [userId]);

  useEffect(() => {
    fetchTasks();
    const channel = supabase.channel('worker-tasks').on('postgres_changes',
      { event: '*', schema: 'public', table: 'service_requests' },
      () => fetchTasks()
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  const handleAction = async (id: string, status: string) => {
    const { error } = await supabase.from('service_requests').update({ status, worker_id: userId }).eq('id', id);
    if (error) toast.error(error.message); else toast.success("Task updated!");
  };

  return (
    <div className="space-y-6"><h2 className="text-2xl font-bold">Tasks</h2>
      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="p-6"><h3 className="font-semibold">{task.services?.name}</h3><p className="text-sm">Customer: {task.profiles?.full_name}</p><div className="flex gap-2 mt-4">
            <Button onClick={() => handleAction(task.id, 'accepted')} size="sm" className="bg-gradient-primary">Accept</Button>
            <Button onClick={() => handleAction(task.id, 'completed')} size="sm" variant="outline">Complete</Button>
          </div></Card>
        ))}
      </div>
    </div>
  );
};
