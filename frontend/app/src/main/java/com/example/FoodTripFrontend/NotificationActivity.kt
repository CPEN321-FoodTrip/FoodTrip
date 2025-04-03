package com.example.FoodTripFrontend

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.FoodTripFrontend.BuildConfig.SERVER_URL
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.IOException

class NotificationActivity : FirebaseMessagingService() {
    private val client = OkHttpClient()

    companion object {
        private const val TAG = "NotificationActivity"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val title = remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "New Message"
        val message = remoteMessage.notification?.body ?: remoteMessage.data["body"] ?: "You have a new notification"

        Log.d(TAG, "Message received: $message")

        showNotification(title, message)
    }

    private fun showNotification(title: String, message: String) {
        val channelId = "firebase_channel"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                Log.w(TAG, "Permission not granted. Notification not shown.")
                return
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId, "Firebase Notifications", NotificationManager.IMPORTANCE_HIGH
            )
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }

        // Intent to open MainActivity when notification is tapped
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Create the notification
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_notification)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        NotificationManagerCompat.from(this).notify(1, notification)
    }

    // in case fcm token changes, update backend
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCM", "New FCM Token: $token")

        val userEmail = getUserEmail() ?: return
        deleteOldToken(userEmail) { success ->
            if (success) {
                Log.d("FCM", "Old FCM token deleted successfully, registering new one...")
                registerNewToken(userEmail, token)
            } else {
                Log.d("FCM", "Old token deletion failed (likely not subscribed), skipping registration")
            }
        }
    }

    // helper function to fetch user email
    private fun getUserEmail(): String? {
        val sharedPref = getSharedPreferences("UserData", MODE_PRIVATE)
        return sharedPref.getString("userEmail", null)
    }

    // helper function to delete old fcm token
    private fun deleteOldToken(userEmail: String, callback: (Boolean) -> Unit) {
        val deleteRequest = Request.Builder()
            .url("${SERVER_URL}notifications/$userEmail")
            .delete()
            .build()

        client.newCall(deleteRequest).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("FCM", "Failed to delete old FCM token", e)
                callback(false)
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (response.isSuccessful) {
                        callback(true)
                    } else {
                        callback(false)
                    }
                }
            }
        })
    }

    // helper function to register new fcm token
    private fun registerNewToken(userEmail: String, token: String) {
        val jsonBody = JSONObject().apply {
            put("userID", userEmail)
            put("fcmToken", token)
        }
        val body = jsonBody.toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

        val postRequest = Request.Builder()
            .url("${SERVER_URL}notifications")
            .post(body)
            .build()

        client.newCall(postRequest).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("FCM", "Failed to register new FCM token", e)
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (response.isSuccessful) {
                        Log.d("FCM", "New FCM token registered successfully")
                    } else {
                        Log.e("FCM", "Failed to register new FCM token: ${response.code}")
                    }
                }
            }
        })
    }
}