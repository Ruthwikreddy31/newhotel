# 🚨 TROUBLESHOOTING: "No Role Assigned" Error

## 🎯 **Quick Fix Steps:**

### **Step 1: Apply Database Fix (CRITICAL)**
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Fix for "No Role Assigned to User" Issue
DROP POLICY IF EXISTS "Managers can insert roles" ON public.user_roles;

CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can insert any role"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);
```

4. Click **Run** to execute the SQL

### **Step 2: Start the Application**
```bash
cd royal-hostel-hub-main
npm run dev
```

### **Step 3: Test Customer Signup**
1. Open http://localhost:8080
2. Click **"Customer"** card
3. Click **"Sign Up"** (if not already selected)
4. Enter test details:
   - Full Name: `Test Customer`
   - Email: `customer@test.com`
   - Password: `password123`
5. Click **"Sign Up"**

### **Step 4: Expected Result**
- Should redirect to customer dashboard
- No "no role assigned" error

## 🔍 **If Still Getting Error:**

### **Check 1: Browser Console**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for red error messages
4. Take screenshot of any errors

### **Check 2: Network Tab**
1. Go to Network tab in DevTools
2. Try signing up again
3. Look for failed requests (red entries)
4. Check if Supabase requests are failing

### **Check 3: Supabase Dashboard**
1. Go to your Supabase project
2. Check **Authentication** → **Users**
3. Check **Table Editor** → **profiles**
4. Check **Table Editor** → **user_roles**

## 🧪 **Testing Order:**

### **1. Test Customer First:**
- Most basic functionality
- Room booking features
- Service requests

### **2. Test Worker:**
- Task management
- Service completion
- Customer interaction

### **3. Test Manager:**
- Admin functions
- User management
- Analytics

## 🚀 **Quick Test Commands:**

### **Check if server is running:**
```bash
netstat -an | findstr :8080
```

### **Check environment variables:**
```bash
Get-Content .env
```

### **Restart server:**
```bash
npm run dev
```

## 📱 **Expected User Flow:**

### **Customer Signup:**
1. Click "Customer" → Auth page
2. Fill signup form → Account created
3. Role assigned → Customer dashboard
4. Can book rooms and request services

### **Worker Signup:**
1. Click "Worker" → Auth page
2. Fill signup form → Account created
3. Role assigned → Worker dashboard
4. Can view and complete tasks

### **Manager Signup:**
1. Click "Manager" → Auth page
2. Fill signup form → Account created
3. Role assigned → Manager dashboard
4. Can manage users and view analytics

## ✅ **Success Indicators:**
- ✅ No error messages in console
- ✅ User created in Supabase Auth
- ✅ Profile created in profiles table
- ✅ Role assigned in user_roles table
- ✅ Redirect to appropriate dashboard
- ✅ Dashboard loads with user interface

## 🆘 **If Nothing Works:**
1. **Clear browser cache** (Ctrl+Shift+R)
2. **Try incognito mode**
3. **Check Supabase project status**
4. **Verify environment variables**
5. **Re-run database migration**

**The database policy fix is the most important step - apply it first!**
