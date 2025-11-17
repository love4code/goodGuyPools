# Good Guy Pools CMS

Production-ready CMS for a swimming pool sales and construction company.

## Tech Stack

- Node.js, Express, EJS, MongoDB (Mongoose), Bootstrap 5
- Sessions (express-session), bcrypt, multer uploads, Nodemailer

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Create `.env` in project root

```
MONGODB_URI=mongodb://localhost:27017/goodfella_pools
PORT=4000
SESSION_SECRET=change_me_in_production

# SMTP (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password_or_smtp_password
FROM_EMAIL=your_email@example.com
CONTACT_RECEIVER=Aquarianpoolandspa@gmail.com
```

3. Run in development

```bash
npm run dev
```

Visit `http://localhost:4000`.

## Update Bootstrap Icons list (for Services icon picker)

To refresh the icon list used by the Services icon picker, run:

```bash
npm run icons:update
```

This downloads the Bootstrap Icons CSS from the CDN and regenerates
`public/js/icons.json`. You can override the CDN URL with:

```bash
BI_CDN_URL=https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css npm run icons:update
```

## Admin

- Admin routes under `/admin`
- Create first admin user via Mongo shell or seed:
  - Insert into `adminusers` collection:
    `{ email: "...", passwordHash: bcrypt-hash }`
  - Or use `AdminUser.createWithPassword(email, password)` in a small script.

## Features

- Admin Authentication (email+password, hashed)
- Admin Dashboard with analytics (page views)
- Projects CRUD with featured and gallery images
- Media Library with uploads to `/uploads`
- Contacts management (list, detail, mark read/unread)
- Site Settings (header/footer/social/SEO defaults)
- Public pages: Home, About, Portfolio, Project Detail, Contact
- Email notifications on contact form via Nodemailer

## Scripts

- `npm run dev` – start with nodemon
- `npm start` – start in production mode
# goodGuyPools
