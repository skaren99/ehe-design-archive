# EHE Events

Estonian and English event website with a price calculator and rental bookings.

## Local preview

Requires Node.js 24 or newer. From this folder run:

```sh
node server.cjs
```

Open http://127.0.0.1:4173/. Bookings persist in `work/bookings.sqlite`, created automatically. The archive contains no customer records. Product prices and stock are configured in `catalog.json`.

The local server includes the booking API. Hosting only the `dist` folder does not enable real bookings. Public deployment needs a running backend and persistent database storage; the current server binds to localhost.

## Calculator pricing

Wedding prices follow Hinnakiri.xlsx, sheet Arvutuskäik: half-day planning 1080 EUR, full-day planning 2000 EUR, coordination 760 EUR. Decoration packages, travel, additional hours, a second coordinator, venue visits and wedding websites follow that sheet. The earlier agreed pre-wedding dinner price remains 8 EUR per guest. Birthday and summer-event prices retain the agreed smoothly interpolated guest pricing, since the workbook does not specify replacement prices for them.

No VAT is added. Rental periods include 36 hours of customer use and 48 hours of reserved inventory. Each additional day extends both periods by 24 hours and adds 10% of the base rental price.

## Admin

Open `/admin/`. The first startup generates a random password in `work/admin-access.txt`. Change it using the admin password tab. Passwords are hashed; sessions expire after eight hours or a server restart. Keep the entire `work` directory private and back it up together with `catalog.json` and `dist/uploads`.

The admin edits calculator prices, product names/descriptions in Estonian and English, product prices/stock, up to five images per product, date closures, page text, the homepage image and the contact-page leader profile. Image uploads support JPEG, PNG and WebP, up to 5 MB each. Set product stock to zero to hide it. Existing bookings remain recorded.

Closed date ranges include both end dates in Estonian time. Rental closures prevent new bookings whose full reserved period overlaps the closed dates; they do not cancel existing bookings. Event availability is a separate calendar and date selection opens a contact inquiry, not an automatic event booking.

Changes are stored in `work/settings.json`, `catalog.json` and the SQLite database. The source archive intentionally excludes credentials, sessions and customer data. Public hosting must provide HTTPS and persistent storage for the backend and uploaded images.

Booking confirmations appear on the website. Automatic confirmation emails and online payments are not connected. The contact form opens an email draft addressed to karen@eheevents.ee.
