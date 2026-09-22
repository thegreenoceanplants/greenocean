# Green Ocean — greenocean.co.in

Online store and admin panel for **Green Ocean**, a plant nursery at Balihari, Dhanbad, Jharkhand 828116.

## Files
| File | What it is |
|---|---|
| `index.html` | The whole website + admin panel (single file, photos built in) |
| `assets/og-image.jpg` | Picture shown when the link is shared on WhatsApp / Facebook |
| `sitemap.xml` | List of pages for Google Search Console |
| `robots.txt` | Tells search engines they may read the site |
| `_headers` | Security + caching rules for Cloudflare Pages |
| `404.html` | Friendly "page not found" that returns to home |

## Go live on Cloudflare Pages
1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Pick this GitHub repository
3. Framework preset: **None** · Build command: *(leave empty)* · Build output directory: `/`
4. **Save and Deploy** → site opens at `<project>.pages.dev`
5. **Custom domains** → add `greenocean.co.in` and `www.greenocean.co.in`
   (works after the domain's nameservers point to Cloudflare)

Every time you push a change to GitHub, Cloudflare updates the site by itself.

## After it is live
- Google Search Console → add `greenocean.co.in` → Sitemaps → submit `sitemap.xml`
- Admin panel: footer → **Admin Panel**. Change the admin password in Admin → Settings.

## Current limits (until the Supabase backend is connected)
- Data (orders, accounts, products edited in admin) is saved **in each visitor's own browser**, not on a server.
  A customer's order will **not** reach the admin panel on another device.
- Payment is a demo — no money is collected.
- Do not take real orders until the backend is connected.

## Contact
support@greenocean.co.in · +91 97189 85034
