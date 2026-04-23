<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ad Rejected - OCAS</title>
    <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background-color: #ef4444; padding: 30px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .content p { margin: 0 0 15px; }
        .reason-box { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; color: #991b1b; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>OCAS</h1>
        </div>
        <div class="content">
            <p>Hello {{ $ad->user->name }},</p>
            <p>Thank you for submitting your ad "<strong>{{ $ad->title }}</strong>" to the OCAS marketplace.</p>
            <p>Unfortunately, your ad has been rejected by our administration team. The reason for the rejection is provided below:</p>
            
            <div class="reason-box">
                {{ $reason }}
            </div>
            
            <p>Please review our posting guidelines and feel free to submit a new, compliant ad.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} OCAS Marketplace. All rights reserved.
        </div>
    </div>
</body>
</html>
