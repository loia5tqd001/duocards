# Facebook OAuth Setup Guide

This guide explains how to set up Facebook authentication for your Duocards application using Supabase.

## Prerequisites

- A Supabase project (see main README for setup)
- A Facebook account

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Consumer" as the app type
4. Fill in your app details:
   - **App Name**: Duocards (or your preferred name)
   - **App Contact Email**: Your email address
5. Click "Create App"

## Step 2: Configure Facebook Login

1. In your Facebook App dashboard, go to "Add Products"
2. Find "Facebook Login" and click "Set up"
3. Choose "Web" platform
4. For "Site URL", enter your application URL:
   - **Development**: `http://localhost:5173` (or your dev port)
   - **Production**: Your actual domain (e.g., `https://yourdomain.com`)

## Step 3: Get App Credentials

1. In your Facebook App dashboard, go to "Settings" > "Basic"
2. Copy the following values:
   - **App ID**
   - **App Secret** (click "Show" to reveal it)

## Step 4: Configure Redirect URLs

1. In Facebook App dashboard, go to "Facebook Login" > "Settings"
2. Add your redirect URIs:
   - **Development**: `http://localhost:5173/auth/callback`
   - **Production**: `https://yourdomain.com/auth/callback`
3. Save changes

## Step 5: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Settings"
3. Scroll down to "Auth Providers"
4. Find "Facebook" and toggle it on
5. Enter your Facebook credentials:
   - **Facebook App ID**: The App ID from Step 3
   - **Facebook App Secret**: The App Secret from Step 3
6. Save the configuration

## Step 6: Test the Integration

1. Start your development server: `pnpm dev`
2. Go to your app's home page
3. Click "Sign In" button
4. Click "📘 Facebook" option
5. You should be redirected to Facebook's login page
6. After authorization, you should be redirected back to your app

## Troubleshooting

### Common Issues

1. **"Invalid OAuth redirect URI"**
   - Check that your redirect URL in Facebook App settings matches exactly
   - Ensure you've added both development and production URLs

2. **"App Not Set Up"**
   - Make sure your Facebook App is not in "Development Mode" for production
   - Add test users if still in development mode

3. **"Invalid App ID"**
   - Double-check the App ID and App Secret in Supabase settings
   - Ensure there are no extra spaces or characters

### Facebook App Review

For production use:

1. Your Facebook App needs to be reviewed if you want users outside your test users list
2. Go to "App Review" in your Facebook App dashboard
3. Submit required information and screenshots
4. This process can take several days

### Development vs Production

- **Development Mode**: Only you and added test users can log in
- **Live Mode**: Anyone can log in (requires app review)

## Security Notes

- Never commit your Facebook App Secret to version control
- Use environment variables for all sensitive credentials
- Regularly rotate your App Secret for production apps
- Monitor your app's usage in Facebook Analytics

## Additional Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth Best Practices](https://tools.ietf.org/html/rfc6749)
