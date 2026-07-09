import nodemailer from 'nodemailer';

export async function sendOTPEmail(toEmail, otp) {
    // create transporter INSIDE the function
    // so env variables are definitely loaded
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.BREVO_SMTP_USER,
            pass: process.env.BREVO_SMTP_PASS,
        },
    });

    console.log('BREVO USER:', process.env.BREVO_SMTP_USER);
    console.log('BREVO PASS exists:', !!process.env.BREVO_SMTP_PASS);

    try {
        await transporter.sendMail({
            from: `"Auhentic" <${process.env.BREVO_FROM_EMAIL}>`,
            to: toEmail,
            subject: 'Your Auhentic Verification Code',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color: #c8860a;">Verify your email</h2>
          <p>Use the code below to verify your Auhentic account:</p>
          <div style="
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #c8860a;
            padding: 20px;
            background: #fdf6e3;
            text-align: center;
            border-radius: 8px;
          ">
            ${otp}
          </div>
          <p style="color: #9a7050; margin-top: 16px;">
            This code expires in 10 minutes. Do not share it with anyone.
          </p>
        </div>
      `,
        });
        console.log('OTP email sent successfully to:', toEmail);
    } catch (error) {
        console.error('Brevo send error:', error.message);
        throw error;
    }
}