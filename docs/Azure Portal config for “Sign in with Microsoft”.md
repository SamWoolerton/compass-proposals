# Azure Portal config for “Sign in with Microsoft”

1. Go to the [Azure portal](https://portal.azure.com/) and open **Microsoft Entra ID → App registrations → New registration**.
2. Register the app:
   - **Name**: e.g. "Compass".
   - **Supported account types**: choose who can sign in:
     - _Accounts in any organizational directory and personal Microsoft accounts_ → leave `MICROSOFT_TENANT` unset (defaults to `common`).
     - _Accounts in this organizational directory only_ → restrict to your org; set `MICROSOFT_TENANT` to your **Directory (tenant) ID**.
   - **Redirect URI**: platform **Web**, value `<BASE_URL>/auth/callback/microsoft-entra-id`.
     - We need this to be set to this for now: [`http://localhost:5173/auth/callback/microsoft-entra-id`](http://localhost:5173/auth/callback/microsoft-entra-id)
     - Once the app goes live, we’ll also need to include the live app’s URL here too, like [`https://compassdemo.usebearing.com/auth/callback/microsoft-entra-id`](https://compassdemo.usebearing.com/auth/callback/microsoft-entra-id)
       - If you know the final URL already then you can set this now; if you’re still deciding then you can come back and set it later
3. Click **Register**. On the app's **Overview**, copy the **Application (client) ID** and, if restricting to one org, the **Directory (tenant) ID**.
4. Open **Certificates & secrets → Client secrets → New client secret**. Copy the secret **Value** immediately (it's only shown once).
5. (Usually already present) Under **API permissions**, ensure delegated Microsoft Graph permissions **openid**, **email**, and **profile** are granted. These are the defaults for a new registration.
6. Securely share the credentials (client ID + client secret + (optional) tenant ID) with us [via Pwpush](https://eu.pwpush.com/p/new)
