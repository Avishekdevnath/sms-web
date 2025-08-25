# 📧 Email Setup Guide

## 🎯 **Current Status**
The invite system is working perfectly, but emails are not being sent. This guide will help you set up actual email delivery.

## 🚀 **Quick Setup Options**

### **Option 1: Gmail (Recommended)**

1. **Create a Gmail App Password:**
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

2. **Add to your `.env.local` file:**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

3. **Restart your development server**

### **Option 2: Ethereal Email (Free Testing)**

If you don't want to set up Gmail, the system will automatically use Ethereal Email for testing:

1. **No setup required** - it works automatically
2. **View sent emails** at: https://ethereal.email
3. **Perfect for development** and testing

### **Option 3: Custom SMTP**

For production or other email providers:

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

## 🔧 **How It Works**

The system now has a smart fallback:

1. **First Priority**: Gmail (if configured)
2. **Second Priority**: Ethereal Email (automatic testing)
3. **Last Resort**: Mock emails (console logging)

## ✅ **Testing**

After setup:

1. Go to Students page
2. Click "📧 Invite" on any student
3. Check the terminal for connection status
4. If using Gmail: Check the student's email
5. If using Ethereal: Check https://ethereal.email

## 🎉 **Expected Results**

- **Gmail**: Emails sent to actual inbox
- **Ethereal**: Emails viewable at https://ethereal.email
- **Mock**: Emails logged to console

## 🔒 **Security Notes**

- Never commit `.env.local` to version control
- Use app passwords, not regular passwords
- For production, use a dedicated email service

## 🆘 **Troubleshooting**

### **Gmail Issues:**
- Ensure 2FA is enabled
- Use app password, not regular password
- Check if "Less secure app access" is disabled

### **Connection Errors:**
- Check firewall settings
- Verify port 587 is open
- Try port 465 with `SMTP_SECURE=true`

### **Still Not Working:**
- Check terminal for error messages
- Verify environment variables are loaded
- Restart the development server 