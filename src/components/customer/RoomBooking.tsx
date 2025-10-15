import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BedDouble, Users, DollarSign } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Room = Tables<'rooms'>;

export const RoomBooking = ({ userId }: { userId: string }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'available');
    setRooms(data || []);
  };

  const calculateTotal = () => {
    if (!selectedRoom || !checkIn || !checkOut) return 0;
    const days = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    return days * selectedRoom.price_per_night;
  };

  const handleBooking = async () => {
    if (!selectedRoom || !checkIn || !checkOut) {
      toast.error("Please select a room and dates");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('bookings').insert({
        customer_id: userId,
        room_id: selectedRoom.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        total_price: calculateTotal(),
      });

      if (error) throw error;

      toast.success("Room booked successfully!");
      setSelectedRoom(null);
      setCheckIn("");
      setCheckOut("");
      fetchRooms();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Available Rooms</h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Card key={room.id} className="p-6 shadow-elegant hover:shadow-gold transition-all cursor-pointer"
                onClick={() => setSelectedRoom(room)}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">{room.room_number}</h3>
                </div>
                {selectedRoom?.id === room.id && (
                  <div className="w-4 h-4 rounded-full bg-accent" />
                )}
              </div>
              
              <div>
                <p className="text-lg font-bold text-accent">{room.room_type}</p>
                <p className="text-sm text-muted-foreground">{room.description}</p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{room.capacity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>${room.price_per_night}/night</span>
                </div>
              </div>

              {room.amenities && (
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                      {amenity}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedRoom && (
        <Card className="p-6 shadow-elegant">
          <h3 className="text-xl font-bold mb-4">Complete Your Booking</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkIn">Check-in Date</Label>
              <Input
                id="checkIn"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="checkOut">Check-out Date</Label>
              <Input
                id="checkOut"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {checkIn && checkOut && (
            <div className="mt-4 p-4 bg-gradient-gold/10 rounded-lg">
              <p className="text-lg font-semibold">Total: ${calculateTotal()}</p>
            </div>
          )}

          <Button
            onClick={handleBooking}
            disabled={loading || !checkIn || !checkOut}
            className="w-full mt-4 bg-gradient-primary"
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </Button>
        </Card>
      )}
    </div>
  );
};
