<?php

namespace App\Mail;

use App\Models\Ad;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ad;

    public function __construct(Ad $ad)
    {
        $this->ad = $ad;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Ad is Live on OCAS!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ad-approved',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
