
CREATE OR REPLACE FUNCTION public.create_user_with_role(
  user_id UUID,
  user_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, user_role::public.app_role);
END;
$$;
