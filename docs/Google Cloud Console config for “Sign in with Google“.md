# Google Cloud Console config for “Sign in with Google”

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project (or select an existing one).
2. Open **APIs & Services → OAuth consent screen**.
   - User type: **External** (or **Internal** if you only want your own Google Workspace org to sign in).
   - Fill in the app name, a support email, and a developer contact email (support@usebearing.com is a safe default for the developer contact email)
   - You don't need to add any scopes beyond the defaults (email, profile, openid).
   - If the app is left in "Testing", only test users you list can sign in. Click **Publish app** to allow anyone.
     - We control auth and permissions in the app itself, so having this published publicly isn’t a security risk - a user who signs in but isn’t set up in the app will just get an empty screen telling them to contact an admin to get access.
3. Open **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized redirect URIs**: add `<BASE_URL>/auth/google/callback`
     - We need this to be set to this for now: [`http://localhost:3000/auth/google/callback`](http://localhost:3000/auth/google/callback)
     - Once the app goes live, we’ll also need to include the live app’s URL here too, like [`https://compassdemo.usebearing.com/auth/google/callback`](https://compassdemo.usebearing.com/auth/google/callback)
       - If you know the final URL already then you can set this now; if you’re still deciding then you can come back and set it later
4. Click **Create**. Copy the **Client ID** and **Client secret**.
5. Securely share the credentials (client ID + client secret) with us [via Pwpush](https://eu.pwpush.com/p/new)
