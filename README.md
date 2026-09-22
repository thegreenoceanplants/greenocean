# Green Ocean — greenocean.co.in

Website + admin panel + a small server, all running on Cloudflare Workers (free plan).

```
public/            the website (index.html, sitemap, photos…)
src/worker.js      the server: saves admin changes, orders, messages, reviews, subscribers
wrangler.jsonc     Cloudflare settings
```

## One-time setup (Cloudflare dashboard)
1. **Storage** → Storage & databases → **KV** → Create → name `greenocean-data` → copy its **ID**
2. In GitHub open `wrangler.jsonc` → pencil ✏️ → replace `PASTE_YOUR_KV_ID_HERE` with that ID → Commit
3. Workers & Pages → **greenocean** → Settings → **Variables and Secrets** → Add →
   Type **Secret**, name `ADMIN_PASSWORD`, value = your admin password → Deploy
4. Email Routing → Destination addresses → `thegreenoceanplants@gmail.com` must show **Verified**
5. Open `https://greenocean.co.in/#/admin`, sign in with `thegreenoceanplants@gmail.com` + that password.
   The first sign-in publishes the website data. After that every change goes live by itself.

## Optional: thank-you emails to customers
Create a Brevo account, verify `support@greenocean.co.in` as a sender, make an API key,
and add it as another **Secret** named `BREVO_API_KEY`. Customers then get a thank-you
email for every order and message. Without it, only you get emails.

## Check it works
`https://greenocean.co.in/api/health` should show `"kv":true,"mail":true,"admin":true`.

## Limits of the free plan
KV allows about 1,000 saves a day — plenty for a nursery shop.
Customer accounts (sign-in) are still saved in each customer's own browser.
Payment is not collected online yet.
