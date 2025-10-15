-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('customer', 'worker', 'manager');

-- Create enum for service types
CREATE TYPE public.service_type AS ENUM ('laundry', 'cleaning', 'spa', 'entertainment', 'food');

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'rejected');

-- Create enum for room status
CREATE TYPE public.room_status AS ENUM ('available', 'occupied', 'maintenance');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL UNIQUE,
  room_type TEXT NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  capacity INTEGER NOT NULL,
  status room_status DEFAULT 'available',
  amenities TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type service_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service_requests table
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status request_status DEFAULT 'pending',
  customer_notes TEXT,
  worker_notes TEXT,
  scheduled_time TIMESTAMPTZ,
  completed_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bills table
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid BOOLEAN DEFAULT false,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bill_items table
CREATE TABLE public.bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE NOT NULL,
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for rooms
CREATE POLICY "Everyone can view available rooms"
  ON public.rooms FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage rooms"
  ON public.rooms FOR ALL
  USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for services
CREATE POLICY "Everyone can view available services"
  ON public.services FOR SELECT
  USING (is_available = true);

CREATE POLICY "Managers can view all services"
  ON public.services FOR SELECT
  USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage services"
  ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for bookings
CREATE POLICY "Customers can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Managers can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for service_requests
CREATE POLICY "Customers can view their own requests"
  ON public.service_requests FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create requests"
  ON public.service_requests FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Workers can view assigned requests"
  ON public.service_requests FOR SELECT
  USING (auth.uid() = worker_id OR public.has_role(auth.uid(), 'worker'));

CREATE POLICY "Workers can update assigned requests"
  ON public.service_requests FOR UPDATE
  USING (auth.uid() = worker_id OR public.has_role(auth.uid(), 'worker'));

CREATE POLICY "Managers can view all requests"
  ON public.service_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage all requests"
  ON public.service_requests FOR ALL
  USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for bills
CREATE POLICY "Customers can view their own bills"
  ON public.bills FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Managers and workers can view all bills"
  ON public.bills FOR SELECT
  USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'worker'));

CREATE POLICY "Workers can create bills"
  ON public.bills FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage bills"
  ON public.bills FOR ALL
  USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for bill_items
CREATE POLICY "Users can view bill items for their bills"
  ON public.bill_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bills
      WHERE bills.id = bill_items.bill_id
      AND (bills.customer_id = auth.uid() OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'worker'))
    )
  );

CREATE POLICY "Workers can create bill items"
  ON public.bill_items FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'manager'));

-- Create trigger function for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for service_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;

-- Insert sample rooms
INSERT INTO public.rooms (room_number, room_type, price_per_night, capacity, amenities, description) VALUES
('101', 'Deluxe Suite', 250.00, 2, ARRAY['WiFi', 'TV', 'Mini Bar', 'Balcony'], 'Spacious deluxe suite with city view'),
('102', 'Standard Room', 150.00, 2, ARRAY['WiFi', 'TV'], 'Comfortable standard room'),
('103', 'Family Suite', 350.00, 4, ARRAY['WiFi', 'TV', 'Mini Bar', 'Kitchen'], 'Perfect for families'),
('201', 'Presidential Suite', 500.00, 3, ARRAY['WiFi', 'TV', 'Mini Bar', 'Balcony', 'Jacuzzi'], 'Luxurious presidential suite');

-- Insert sample services
INSERT INTO public.services (service_type, name, description, price) VALUES
('laundry', 'Laundry Service', 'Professional laundry and dry cleaning', 25.00),
('cleaning', 'Room Cleaning', 'Deep cleaning service', 15.00),
('spa', 'Spa Package', 'Relaxing spa treatment', 100.00),
('entertainment', 'Movie Night', 'In-room movie experience', 20.00),
('food', 'Breakfast', 'Continental breakfast', 30.00),
('food', 'Dinner', 'Fine dining experience', 75.00);