import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";

type Bill = Tables<'bills'>;

export const MyBills = ({ userId }: { userId: string }) => {
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    const fetchBills = async () => {
      const { data } = await supabase.from('bills').select('*').eq('customer_id', userId);
      setBills(data || []);
    };
    fetchBills();
  }, [userId]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Bills</h2>
      <div className="grid gap-4">
        {bills.map((bill) => (
          <Card key={bill.id} className="p-6"><p className="font-semibold">Total: ${bill.total_amount}</p><p className="text-sm text-muted-foreground">{bill.paid ? 'Paid' : 'Pending'}</p></Card>
        ))}
      </div>
    </div>
  );
};
