# Good Guy Pools CMS

A production-ready Content Management System for a swimming pool sales and
construction company. Built with Node.js, Express, MongoDB, and Bootstrap 5.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Admin User Setup](#admin-user-setup)
- [Image Upload System](#image-upload-system)
- [Using the Admin Panel](#using-the-admin-panel)
- [Rich Text Editor](#rich-text-editor)
- [Product Management](#product-management)
- [Project Management](#project-management)
- [Contact & Quote Management](#contact--quote-management)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Storage**: GridFS for image storage
- **Templating**: EJS (Embedded JavaScript)
- **Frontend**: Bootstrap 5, Bootstrap Icons
- **Authentication**: Express Sessions, bcrypt
- **File Upload**: Multer, Sharp (image processing)
- **Email**: Nodemailer
- **Rich Text Editor**: Quill.js

## Features

### Public Features

- **Home Page**: Featured projects showcase
- **About Page**: Company information
- **Portfolio Page**: Browse all projects with filtering
- **Project Detail Pages**: Full project descriptions with galleries
- **Products Page**: Browse all available pool products
- **Product Detail Pages**: Detailed product information with quote request
  forms
- **Contact Page**: Contact form with email notifications

### Admin Features

- **Dashboard**: Analytics, recent inquiries, and statistics
- **Project Management**: Create, edit, delete projects with rich text
  descriptions
- **Product Management**: Comprehensive product catalog with metadata
- **Media Library**: Upload and manage images with automatic resizing
- **Contact Management**: View and manage contact inquiries
- **Product Quote Management**: View and manage product quote requests
- **Services Management**: Manage service offerings
- **Site Settings**: Configure site-wide settings, SEO, and social links
- **Theme Customization**: Customize header and footer colors with predefined
  themes or custom colors

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**

```bash
cd goodGuysPools
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment file**

Create a `.env` file in the project root (see
[Environment Variables](#environment-variables) section)

4. **Start the development server**

```bash
npm run dev
```

5. **Visit the application**

Open your browser and navigate to `http://localhost:4000`

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/goodfella_pools
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# Server
PORT=4000

# Session Secret (change this in production!)
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_or_smtp_password
FROM_EMAIL=your_email@gmail.com
CONTACT_RECEIVER=recipient@example.com
```

### Gmail Setup (if using Gmail)

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

## Database Setup

The application uses MongoDB with Mongoose. The database will be automatically
created when you first run the application.

### Collections Created

- `adminusers` - Admin user accounts
- `projects` - Project portfolio items
- `products` - Product catalog
- `contacts` - Contact form submissions
- `productquotes` - Product quote requests
- `media` - Media library entries
- `services` - Service offerings
- `sitesettings` - Site-wide settings
- `pageviews` - Analytics data

## Admin User Setup

### Method 1: Using the create-admin.js script

1. Create a file `create-admin.js` in the project root:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');
const connectDB = require('./config/db');

const email = 'your-email@example.com';
const password = 'your-password';
const name = 'Admin';

async function createAdminUser() {
  try {
    await connectDB();

    let admin = await AdminUser.findOne({ email });

    if (admin) {
      console.log('Admin user already exists. Updating password...');
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      admin.passwordHash = await bcrypt.hash(password, saltRounds);
      await admin.save();
      console.log('Admin user password updated successfully!');
    } else {
      admin = await AdminUser.createWithPassword(email, password, name);
      console.log('Admin user created successfully!');
    }

    console.log('\nAdmin credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
```

2. Run the script:

```bash
node create-admin.js
```

### Method 2: Using MongoDB Shell

```javascript
use goodfella_pools
const bcrypt = require('bcrypt');
const passwordHash = await bcrypt.hash('your-password', 10);
db.adminusers.insertOne({
  email: 'your-email@example.com',
  passwordHash: passwordHash,
  name: 'Admin',
  createdAt: new Date()
})
```

### Accessing Admin Panel

1. Navigate to `http://localhost:4000/admin/login`
2. Enter your admin email and password
3. You'll be redirected to the admin dashboard

## Image Upload System

The application features an advanced image upload system with automatic resizing
and compression.

### Image Sizes Generated

When you upload an image, the system automatically creates three optimized
versions:

- **Thumbnail**: 300x300px (cover fit, WebP quality 80)
- **Medium**: 800x800px (inside fit, WebP quality 85)
- **Large**: 1920x1920px (inside fit, WebP quality 85)

### Storage

- Images are stored in MongoDB GridFS
- All images are converted to WebP format (except GIFs, which are preserved)
- Each size is stored separately with metadata
- References to all sizes are stored in the Media model

### Using Image Sizes

In your views, you can access different image sizes:

```ejs
<!-- Thumbnail -->
<img src="<%= media.sizes.thumbnail.filePath %>" alt="...">

<!-- Medium -->
<img src="<%= media.sizes.medium.filePath %>" alt="...">

<!-- Large (default) -->
<img src="<%= media.filePath %>" alt="...">
<!-- or -->
<img src="<%= media.sizes.large.filePath %>" alt="...">
```

### Media Library

- Access via Admin Panel → Media Library
- Upload single or multiple images
- Images are automatically processed and stored
- All sizes are generated automatically
- Delete images to remove all sizes from GridFS

## Using the Admin Panel

### Dashboard

The admin dashboard provides:

- Project count
- Contact inquiry count
- Product quote request count
- Total page views
- Recent contact inquiries
- Recent product quote requests
- Top pages analytics

### Projects

**Create a Project:**

1. Go to Admin → Projects → Add Project
2. Fill in:
   - Title (required)
   - Location
   - Short Description (required)
   - Description (rich text editor)
   - Project Type (required)
   - Status
   - Featured checkbox
   - Featured Image (from media library or upload)
   - Gallery Images (multiple uploads supported)
   - Start/End Dates

**Edit/Delete Projects:**

- Click "Edit" on any project in the projects list
- Click "Delete" to remove a project

### Products

**Create a Product:**

1. Go to Admin → Products → Add Product
2. Fill in comprehensive product information:
   - Basic Info: Name, SKU, Descriptions
   - Product Media: Featured image and gallery
   - Specifications: Category, Brand, Material, Shape, Dimensions, etc.
   - Pricing & Availability
   - SEO & Marketing: Meta tags, keywords
   - Additional Info: Notes, related products

**Product Features:**

- Multiple image uploads (up to 20 gallery images)
- Rich metadata for comprehensive product information
- Size options for quote requests
- Automatic slug generation for SEO-friendly URLs

### Media Library

**Upload Images:**

1. Go to Admin → Media Library
2. Use the upload form in the admin dropdown or media page
3. Images are automatically:
   - Resized to thumbnail, medium, and large
   - Compressed and converted to WebP
   - Stored in GridFS
   - Added to media library

**Manage Media:**

- View all uploaded images
- Edit title, alt text, and tags
- Delete images (removes all sizes)

### Contacts & Quotes

**View Inquiries:**

- Contact inquiries appear on the dashboard
- View all contacts at Admin → Contacts
- Filter by type and read status
- Mark as read/unread
- View details and delete

**Product Quote Requests:**

- Product quote requests appear on the dashboard
- View all quotes at Admin → Product Quotes
- Filter by read status
- View details including selected sizes
- Mark as read/unread
- Delete requests

### Site Settings & Theme Customization

**Site Settings:**

- Configure company information (name, address, contact details)
- Set up social media links (Facebook, Instagram, TikTok, YouTube)
- Configure SEO settings (default title, meta description, OG image)

**Theme Customization:**

The application includes a comprehensive theme customization system that allows
you to customize the appearance of your header and footer.

**Access Theme Settings:**

1. Go to Admin → Settings
2. Scroll to the "Theme Customization" section

**Predefined Themes:**

The system includes 8 predefined themes:

1. **Default (White)** - Clean white background with blue accents
2. **Ocean Blue** - Deep ocean blue header (#006994) with darker blue footer
3. **Sky Blue** - Light sky blue header (#87ceeb) with medium blue footer
4. **Navy Blue** - Dark navy header (#001f3f) with darker navy footer
5. **Royal Blue** - Royal blue header (#4169e1) with darker blue footer
6. **Dark Theme** - Dark header (#212529) and footer for modern look
7. **Light Theme** - Light gray header (#f8f9fa) with white footer
8. **Custom Colors** - Manual color selection for complete control

**Using Preset Themes:**

1. Select a theme from the "Theme Preset" dropdown
2. All color fields will automatically populate with the theme's colors
3. Click "Save Settings" to apply
4. Changes are immediately visible on the frontend

**Custom Color Customization:**

If you select "Custom Colors" or want to fine-tune a preset:

**Header Colors:**

- **Background Color**: Main header/navbar background
- **Brand Text Color**: Company name/logo color
- **Link Color**: Navigation link text color
- **Link Hover Color**: Navigation link hover state color

**Footer Colors:**

- **Background Color**: Footer background color
- **Text Color**: Footer text color
- **Link Color**: Footer link color
- **Link Hover Color**: Footer link hover state color
- **Border Color**: Top border color of footer

**Color Input Methods:**

- Use the color picker for visual selection
- Enter hex color codes directly in the text field (e.g., `#0d6efd`)
- Both methods stay synchronized automatically

**Tips:**

- Use contrasting colors for text readability
- Test hover states to ensure good visibility
- Consider accessibility - ensure sufficient color contrast
- Preview changes by saving and viewing the frontend
- Colors are applied via inline styles for immediate effect

## Rich Text Editor

The project description field uses Quill.js rich text editor with Bootstrap 5
support.

### Features

- **Text Formatting**: Bold, italic, underline, strikethrough
- **Headers**: H1-H6
- **Colors**: Text and background colors
- **Lists**: Ordered and bullet lists
- **Alignment**: Left, center, right, justify
- **Media**: Links, images, blockquotes, code blocks
- **Bootstrap Components**: Quick insert buttons for:
  - Bootstrap Buttons
  - Bootstrap Cards
  - Bootstrap Badges
  - Bootstrap Alerts

### Using Bootstrap Components

1. Click the Bootstrap component button in the toolbar
2. The component HTML will be inserted
3. Edit the text/content directly in the editor
4. The component will render with Bootstrap 5 styles on the frontend

## Product Management

### Creating Products

1. Navigate to Admin → Products → Add Product
2. Fill in all relevant fields:
   - **Basic Information**: Name, SKU, descriptions
   - **Media**: Upload featured image and gallery images
   - **Specifications**: All product details
   - **SEO**: Meta information for search engines
3. Save the product

### Product Quote Requests

When visitors request quotes:

1. They fill out the quote form on the product detail page
2. Select pool sizes (if available)
3. Submit the request
4. Request is saved to database
5. Email notification is sent (if configured)
6. Request appears in Admin → Product Quotes

## Project Management

### Creating Projects

1. Navigate to Admin → Projects → Add Project
2. Use the rich text editor for the description
3. Upload featured image and gallery images
4. Set project type, status, and dates
5. Mark as featured if needed

### Project Display

- **Portfolio Page**: Shows project cards (title, location, type)
- **Project Detail Page**: Shows full description with rich text formatting,
  gallery, and call-to-action

## Contact & Quote Management

### Contact Form Submissions

- Submitted via public contact page
- Saved to database
- Email notification sent (if configured)
- Appears in Admin → Contacts
- Can be marked as read/unread
- Can be filtered by project type

### Product Quote Requests

- Submitted via product detail pages
- Includes product information and selected sizes
- Saved to database
- Email notification sent (if configured)
- Appears in Admin → Product Quotes
- Can be marked as read/unread

## Deployment

### Heroku Deployment

1. **Create Heroku App**

```bash
heroku create your-app-name
```

2. **Set Environment Variables**

```bash
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set SESSION_SECRET=your-secret-key
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=your_email@gmail.com
heroku config:set SMTP_PASS=your_app_password
heroku config:set FROM_EMAIL=your_email@gmail.com
heroku config:set CONTACT_RECEIVER=recipient@example.com
```

3. **Deploy**

```bash
git push heroku main
```

4. **Create Admin User**

After deployment, create an admin user using the create-admin.js script or
MongoDB shell.

### Important Notes for Production

- Change `SESSION_SECRET` to a strong random string
- Use MongoDB Atlas or a production MongoDB instance
- Ensure email credentials are correct
- Test all functionality after deployment
- Set up proper backup procedures for MongoDB

## Troubleshooting

### Common Issues

**1. "H10 Error" on Heroku**

- Ensure `Procfile` contains: `web: npm start`
- Check that `MONGODB_URI` is set correctly
- Verify all environment variables are set

**2. "Invalid ELF header" Error**

- This occurs when native modules (like bcrypt) aren't rebuilt
- The `postinstall` script should handle this automatically
- If issues persist, ensure `node_modules` is in `.gitignore`

**3. Images Not Uploading**

- Check file size limits (100MB max)
- Verify GridFS is working (check MongoDB connection)
- Ensure Sharp is installed correctly

**4. Email Not Sending**

- Verify SMTP credentials
- Check Gmail App Password if using Gmail
- Ensure `SMTP_USER` and `SMTP_PASS` are correct
- Check spam folder

**5. Rich Text Editor Not Working**

- Ensure Quill.js CDN is accessible
- Check browser console for errors
- Verify Bootstrap 5 CSS is loaded

**6. Admin Login Not Working**

- Verify admin user exists in database
- Check password hash is correct
- Ensure session secret is set
- Clear browser cookies and try again

### Database Connection Issues

If MongoDB connection fails:

1. Verify `MONGODB_URI` is correct
2. Check MongoDB is running (if local)
3. Verify network access (if cloud)
4. Check MongoDB credentials

### Image Processing Issues

If images aren't processing:

1. Verify Sharp is installed: `npm install sharp`
2. Check file permissions
3. Ensure sufficient disk space
4. Check GridFS bucket exists

## Scripts

- `npm start` - Start in production mode
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run icons:update` - Update Bootstrap Icons list
- `npm run postinstall` - Rebuild native modules (runs automatically after
  install)

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review error logs
3. Check MongoDB connection
4. Verify environment variables

## License

ISC

---

**Built with ❤️ for Good Guy Pools**
