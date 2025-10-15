# Fix for "No Role Assigned to User" Issue

## Problem Description
Users are getting "No role assigned to this user" error when trying to log in after signup.

## Root Cause
The issue is caused by Row Level Security (RLS) policies in Supabase that prevent users from inserting their own role during signup. The current policy only allows managers to insert roles, but during signup, the user doesn't have any role yet.

## Solutions

### 1. Database Policy Fix (Recommended)
Run the SQL commands in `fix-user-roles.sql` to update the RLS policies:

```sql
-- Allow users to insert their own role during signup
DROP POLICY IF EXISTS "Managers can insert roles" ON public.user_roles;

CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can insert any role"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'manager'));
```

### 2. Application-Level Improvements
The Auth.tsx file has been updated with:
- Better error handling for role assignment
- More descriptive error messages
- Proper error logging for debugging

### 3. Alternative Solutions

#### Option A: Use Supabase Functions
Create a Supabase function that handles user creation and role assignment:

```sql
CREATE OR REPLACE FUNCTION public.create_user_with_role(
  user_id UUID,
  user_role app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, user_role);
END;
$$;
```

#### Option B: Disable RLS Temporarily
If you need a quick fix, you can temporarily disable RLS on the user_roles table:

```sql
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
```

**Warning**: This reduces security and should only be used temporarily.

## Testing the Fix

1. **Clear existing data** (if testing):
   ```sql
   DELETE FROM public.user_roles;
   DELETE FROM public.profiles;
   ```

2. **Test signup flow**:
   - Try signing up as a customer
   - Try signing up as a worker  
   - Try signing up as a manager

3. **Test login flow**:
   - Login with the created accounts
   - Verify proper redirection based on role

## Prevention

To prevent this issue in the future:

1. **Always test RLS policies** with actual user flows
2. **Use Supabase functions** for complex operations that need elevated permissions
3. **Implement proper error handling** in the application layer
4. **Add logging** to track role assignment failures

## Current Status
- ✅ Application code updated with better error handling
- ⏳ Database policy fix needs to be applied in Supabase dashboard
- ✅ Improved user experience with descriptive error messages

