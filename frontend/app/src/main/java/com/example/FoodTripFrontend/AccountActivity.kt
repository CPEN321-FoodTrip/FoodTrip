package com.example.FoodTripFrontend

import android.content.SharedPreferences
import android.os.Bundle
import android.util.Log
import android.widget.Switch
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import okhttp3.*
import com.example.FoodTripFrontend.BuildConfig.SERVER_URL
import com.google.firebase.messaging.FirebaseMessaging
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

/**
 * Activity to manage account preferences such as notifications and allergies.
 */
class AccountActivity : AppCompatActivity() {
    private val client = OkHttpClient()
    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var notificationsSwitch: Switch

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_account)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        notificationsSwitch = findViewById(R.id.notifications_switch)
        sharedPreferences = getSharedPreferences("UserData", MODE_PRIVATE)
        val userEmail = getUserEmail()

        // if the first time using notifications
        if (!sharedPreferences.contains("notifications_switch_state")) {
            notificationsSwitch.isChecked = true
            saveSwitchState(true)
            subscribeNotifications(userEmail) // auto-subscribe
        } else {
            notificationsSwitch.isChecked = sharedPreferences.getBoolean("notifications_switch_state", false)
        }

        notificationsSwitch.setOnCheckedChangeListener { _, isChecked ->
            saveSwitchState(isChecked)
            if (isChecked) {
                subscribeNotifications(userEmail) // subscribe (POST)
            } else {
                unsubscribeNotifications(userEmail) // unsubscribe (DELETE)
            }
        }
    }

    private fun getUserEmail(): String {
        return sharedPreferences.getString("userEmail", "No email found").toString()
    }

    private fun saveSwitchState(isEnabled: Boolean) {
        sharedPreferences.edit().putBoolean("notifications_switch_state", isEnabled).apply()
    }

    private fun getFcmToken(callback: (String?) -> Unit) {
        FirebaseMessaging.getInstance().token
            .addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    Log.w("FCM", "Fetching FCM token failed", task.exception)
                    callback(null)
                    return@addOnCompleteListener
                }

                val token = task.result
                Log.d("FCM", "FCM Token: $token")
                callback(token)
            }
    }

    private fun subscribeNotifications(email: String) {
        getFcmToken { fcmToken ->
            if (fcmToken == null) {
                Log.e("FCM", "Failed to get FCM token")
                return@getFcmToken
            }

            val jsonBody = JSONObject().apply {
                put("userID", email)
                put("fcmToken", fcmToken)
            }
            val body = jsonBody.toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

            val request = Request.Builder()
                .url("${SERVER_URL}notifications")
                .post(body)
                .build()

            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    Log.e("Network", "Failed to update notifications", e)
                }

                override fun onResponse(call: Call, response: Response) {
                    response.use {
                        if (response.isSuccessful) {
                            runOnUiThread {
                                Toast.makeText(this@AccountActivity, "Notifications updated successfully", Toast.LENGTH_SHORT).show()
                            }
                        } else if (response.code == 400) {
                            Log.d("AccountActivity", "Already subscribed - ignoring error")
                        } else {
                            runOnUiThread {
                                Toast.makeText(this@AccountActivity, "Failed to update notifications", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }
            })
        }
    }

    private fun unsubscribeNotifications(email: String) {
        val request = Request.Builder()
            .url("${SERVER_URL}notifications/$email")
            .delete()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("Network", "Failed to disable notifications", e)
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    runOnUiThread {
                        if (response.isSuccessful) {
                            Toast.makeText(this@AccountActivity, "Notifications disabled successfully", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(this@AccountActivity, "Failed to disable notifications", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
        })
    }

}
