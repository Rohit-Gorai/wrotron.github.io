# wrotron.github.io

Website for Wrotron: smart cashless vending machines installed, stocked, monitored and maintained across India. Served at https://wrotron.in via GitHub Pages.

- `index.html`: the page
- `styles.css`: design system (colour roles, type scale, components) and layout
- `scripts.js`: navigation, vending demo, business-case estimate, enquiry form (Firestore `vending_leads`, WhatsApp fallback)
- `privacy.html`, `credits.html`: privacy policy and photo attribution
- `assets/photos/`: WebP + JPEG photos at two sizes; `credits.json` records source, author and licence

## Adding proof (metrics, clients, case studies)

These sections stay hidden until they have real data. Edit the `site-data` block in the `<head>` of `index.html`:

```json
{
  "metrics": [{ "value": "25+", "label": "Machines deployed" }],
  "clients": [{ "name": "Company", "logo": "assets/clients/company.svg" }],
  "caseStudies": [{
    "customer": "A 500-person office campus", "location": "Pune",
    "challenge": "…", "solution": "…",
    "results": [{ "value": "…", "label": "…" }]
  }]
}
```

Only add numbers, clients and results you can verify.

## Photos

Photos come from Wikimedia Commons under CC0, CC BY, CC BY-SA or public-domain terms. Replace them with Wrotron's own photos as soon as possible, and keep `credits.json` and `credits.html` in step.
