<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ModerationActionMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $actionName;
    public $adTitle;

    public function __construct($userName, $actionName, $adTitle = null)
    {
        $this->userName = $userName;
        $this->actionName = $actionName;
        $this->adTitle = $adTitle;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'OCAS Moderation Action: ' . $this->actionName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.moderation-action',
        );
    }
}
