<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public $adId;
    public $adTitle;
    public $reporterName;
    public $reason;

    public function __construct($adId, $adTitle, $reporterName, $reason)
    {
        $this->adId = $adId;
        $this->adTitle = $adTitle;
        $this->reporterName = $reporterName;
        $this->reason = $reason;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Ad Report Submitted - OCAS',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-report',
        );
    }
}
