package com.example.FoodTripFrontend

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FirebaseNotifications : FirebaseMessagingService() {
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        if (remoteMessage.data.size > 0) {
            // Handle the data payload
        }
        if (remoteMessage.notification != null) {
            // Handle the notification payload
            remoteMessage.notification!!.body?.let { sendNotification(it) }
        }
    }

    private fun sendNotification(messageBody: String) {
        // Use Notification Manager to show a notification to the user
    }
}