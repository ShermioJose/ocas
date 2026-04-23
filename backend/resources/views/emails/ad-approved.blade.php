<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ad Approved - OCAS</title>
    <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background-color: #10b981; padding: 30px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .content p { margin: 0 0 15px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>OCAS</h1>
        </div>
        <div class="content">
            <p>Hello {{ $ad->user->name }},</p>
            <p>Great news! Your ad "<strong>{{ $ad->title }}</strong>" has been reviewed and approved by our team.</p>
            <p>It is now live on the OCAS marketplace and visible to buyers worldwide.</p>
            <a href="{{ env('APP_URL') }}/ads/{{ $ad->id }}" class="btn">View Your Ad</a>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} OCAS Marketplace. All rights reserved.
        </div>
    </div>
</body>
</html>
