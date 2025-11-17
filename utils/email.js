const nodemailer = require('nodemailer');

function createTransporter () {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendContactEmail ({
  name,
  town,
  phoneNumber,
  email,
  projectType,
  message,
}) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Email disabled. Missing SMTP_USER/SMTP_PASS');
    return null;
  }

  const to = process.env.CONTACT_RECEIVER || 'Aquarianpoolandspa@gmail.com';
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const subject = `New Inquiry from ${name} - ${projectType}`;
  const text = `
New inquiry submitted

Name: ${name}
Town: ${town}
Phone: ${phoneNumber}
Email: ${email}
Project Type: ${projectType}
Message:
${message || ''}
`.trim();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#0d6efd;border-bottom:2px solid #e9ecef;padding-bottom:8px">New Inquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Town:</strong> ${town}</p>
      <p><strong>Phone:</strong> ${phoneNumber}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Project Type:</strong> ${projectType}</p>
      ${
        message
          ? `<div><strong>Message:</strong><br><div style="background:#f8f9fa;border-left:4px solid #0d6efd;padding:12px">${message.replace(
              /\n/g,
              '<br>',
            )}</div></div>`
          : ''
      }
      <p style="color:#6c757d;font-size:12px;margin-top:12px">Submitted: ${new Date().toLocaleString()}</p>
    </div>
  `;

  try {
    return await transporter.sendMail({ from, to, subject, text, html });
  } catch (err) {
    console.error('Email send error:', err.message);
    return null;
  }
}

async function sendQuoteRequestEmail ({
  name,
  city,
  email,
  phone,
  message,
  serviceType,
  selectedSizes,
  productName,
}) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Email disabled. Missing SMTP_USER/SMTP_PASS');
    return null;
  }

  const to = process.env.CONTACT_RECEIVER || 'Aquarianpoolandspa@gmail.com';
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const subject = `New Quote Request for ${productName} from ${name}`;
  const sizesText =
    selectedSizes && selectedSizes.length > 0
      ? selectedSizes.join(', ')
      : 'None selected';

  const text = `
New Quote Request

Product: ${productName}
Name: ${name}
City: ${city}
Phone: ${phone}
Email: ${email}
Service Type: ${serviceType}
Selected Sizes: ${sizesText}
Message:
${message || ''}
`.trim();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#0d6efd;border-bottom:2px solid #e9ecef;padding-bottom:8px">New Quote Request</h2>
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>City:</strong> ${city}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Service Type:</strong> ${serviceType}</p>
      <p><strong>Selected Sizes:</strong> ${sizesText}</p>
      ${
        message
          ? `<div><strong>Message:</strong><br><div style="background:#f8f9fa;border-left:4px solid #0d6efd;padding:12px">${message.replace(
              /\n/g,
              '<br>',
            )}</div></div>`
          : ''
      }
      <p style="color:#6c757d;font-size:12px;margin-top:12px">Submitted: ${new Date().toLocaleString()}</p>
    </div>
  `;

  try {
    return await transporter.sendMail({ from, to, subject, text, html });
  } catch (err) {
    console.error('Email send error:', err.message);
    return null;
  }
}

module.exports = { sendContactEmail, sendQuoteRequestEmail };
