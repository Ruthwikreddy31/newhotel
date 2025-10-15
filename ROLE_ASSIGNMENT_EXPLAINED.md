# 🔐 Role Assignment System Explained

## 🎯 **What is "No Role Assigned"?**

The "no role assigned" error occurs when a user signs up but the system fails to assign them a role (customer, worker, or manager) in the database. This is a security feature that ensures every user has a specific role.

## 🏗️ **How the System Works:**

### **1. User Signup Process:**
```
User clicks "Customer" → Auth page → Signup form → Account created → Role assigned → Dashboard
```

### **2. Role Assignment Flow:**
1. **User signs up** with email/password
2. **Account created** in Supabase Auth
3. **Profile created** automatically (via database trigger)
4. **Role inserted** into `user_roles` table
5. **User redirected** to appropriate dashboard

### **3. Database Structure:**
- `auth.users` - Supabase authentication users
- `profiles` - User profile information
- `user_roles` - Links users to their roles (customer/worker/manager)

## 🚨 **Why "No Role Assigned" Happens:**

### **Most Common Cause: Database Policy Issue**
The `user_roles` table has Row Level Security (RLS) policies that prevent users from inserting their own roles during signup.

### **Other Causes:**
1. **Database connection issues**
2. **Missing environment variables**
3. **Supabase project not set up**
4. **Database migration not run**

## 🔧 **How to Fix "No Role Assigned":**

### **Step 1: Apply Database Fix**
Run this SQL in your Supabase dashboard:

```sql
-- Allow users to insert their own role during signup
DROP POLICY IF EXISTS "Managers can insert roles" ON public.user_roles;

CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### **Step 2: Verify Environment Variables**
Check your `.env` file has:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### **Step 3: Test the Flow**
1. Go to http://localhost:8080
2. Click "Customer"
3. Sign up with a test email
4. Should redirect to customer dashboard

## 👥 **Who Should Login First?**

### **For Testing:**
1. **Customer** - Test room booking and services
2. **Worker** - Test task management
3. **Manager** - Test admin functions

### **For Production:**
1. **Manager** - Set up the system first
2. **Workers** - Add staff members
3. **Customers** - Regular users

## 🧪 **Testing Order:**

### **1. Test Customer Signup:**
- Click "Customer" → Sign up → Should go to customer dashboard
- Test room booking functionality

### **2. Test Worker Signup:**
- Click "Worker" → Sign up → Should go to worker dashboard
- Test task management

### **3. Test Manager Signup:**
- Click "Manager" → Sign up → Should go to manager dashboard
- Test admin functions

## 🚀 **Quick Start Guide:**

### **1. Start the Application:**
```bash
cd royal-hostel-hub-main
npm run dev
```

### **2. Open Browser:**
Go to http://localhost:8080

### **3. Test Customer Signup:**
1. Click "Customer" card
2. Click "Sign Up" (if not already selected)
3. Enter:
   - Full Name: Test User
   - Email: test@example.com
   - Password: password123
4. Click "Sign Up"
5. Should redirect to customer dashboard

### **4. If Still Getting "No Role Assigned":**
1. Check browser console for errors
2. Verify Supabase connection
3. Apply the database fix above
4. Try signing up again

## 🔍 **Debugging Steps:**

### **Check Browser Console:**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages during signup

### **Check Network Tab:**
1. Go to Network tab in DevTools
2. Try signing up
3. Look for failed requests (red entries)

### **Verify Supabase:**
1. Go to Supabase Dashboard
2. Check if user was created in Auth
3. Check if profile was created
4. Check if role was assigned

## ✅ **Success Indicators:**
- User account created in Supabase Auth
- Profile created in `profiles` table
- Role assigned in `user_roles` table
- Redirect to appropriate dashboard
- No error messages in console

**The key is applying the database policy fix - that's what resolves the "no role assigned" issue!**
