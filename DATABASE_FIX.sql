-- Fix for "No Role Assigned to User" Issue
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the restrictive policy that prevents users from inserting their own role
DROP POLICY IF EXISTS "Managers can insert roles" ON public.user_roles;

-- Step 2: Allow users to insert their own role during signup
CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 3: Keep manager permissions for managing other users' roles
CREATE POLICY "Managers can insert any role"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- Step 4: Allow users to view their own role
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Step 5: Test the fix by checking if the policies are working
-- You can test this by running:
-- SELECT * FROM public.user_roles WHERE user_id = auth.uid();

