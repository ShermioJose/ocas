<?php

namespace App\Mail;

use App\Models\Ad;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ad;
    public $reason;

    public function __construct(Ad $ad, string $reason)
    {
        $this->ad = $ad;
        $this->reason = $reason;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Action Required: Your OCAS Ad Update',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ad-rejected',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
