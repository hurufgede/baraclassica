<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderCreatedNotification extends Notification
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'order_created',
            'title' => 'Pesanan dibuat',
            'message' => "Pesanan {$this->order->order_number} berhasil dibuat. Total Rp ".number_format($this->order->grand_total, 0, ',', '.'),
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
        ];
    }
}
