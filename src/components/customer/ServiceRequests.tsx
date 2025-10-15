import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<'services'>;

export const ServiceRequests = ({ userId }: { userId: string }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').eq('is_available', true);
    setServices(data || []);
  };

  const handleRequest = async () => {
    if (!selectedService) return;
    const { error } = await supabase.from('service_requests').insert({
      customer_id: userId,
      service_id: selectedService.id,
      customer_notes: notes,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Service requested!");
      setSelectedService(null);
      setNotes("");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Request Services</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="p-6 shadow-elegant hover:shadow-gold transition-all cursor-pointer"
                onClick={() => setSelectedService(service)}>
            <h3 className="font-semibold text-lg">{service.name}</h3>
            <p className="text-sm text-muted-foreground mt-2">{service.description}</p>
            <p className="text-accent font-bold mt-4">${service.price}</p>
          </Card>
        ))}
      </div>
      {selectedService && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Request {selectedService.name}</h3>
          <Label>Special Instructions</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2" />
          <Button onClick={handleRequest} className="mt-4 bg-gradient-primary">Submit Request</Button>
        </Card>
      )}
    </div>
  );
};
