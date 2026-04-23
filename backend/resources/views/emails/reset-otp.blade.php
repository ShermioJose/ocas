<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your OCAS Password</title>
    <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background-color: #dc2626; padding: 30px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .content p { margin: 0 0 15px; }
        .otp-box { background-color: #fef2f2; border: 2px dashed #fecaca; text-align: center; padding: 20px; margin: 30px 0; border-radius: 8px; }
        .otp-code { font-size: 36px; font-weight: bold; color: #7f1d1d; letter-spacing: 4px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>OCAS Password Reset</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset the password for your OCAS account. Please use the following One-Time Password (OTP) to securely reset your password:</p>
            
            <div class="otp-box">
                <div class="otp-code">{{ $otp }}</div>
            </div>
            
            <p>This code is valid for <strong>10 minutes</strong>.</p>
            <p>If you did not request a password reset, please secure your account immediately and ignore this email.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} OCAS Marketplace. All rights reserved.
        </div>
    </div>
</body>
</html>
