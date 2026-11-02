const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email Error:', error);
    return false;
  }
};

const notificationTemplates = {
  newDonation: (donorName, quantity, expiryTime) => `
    <h2>🍲 New Food Available!</h2>
    <p><strong>${donorName}</strong> has listed ${quantity} servings.</p>
    <p>⏰ Expires at: ${expiryTime}</p>
    <p>Accept now to prevent food waste!</p>
  `,
  donationAccepted: (donorName, organization) => `
    <h2>✅ Your Donation Accepted!</h2>
    <p><strong>${organization}</strong> has accepted your food donation.</p>
    <p>Thank you for reducing food waste!</p>
  `,
  pickupReminder: (foodType, time) => `
    <h2>🚚 Pickup Reminder</h2>
    <p>Please pick up ${foodType} by ${time}</p>
  `
};

module.exports = { sendEmail, notificationTemplates };
