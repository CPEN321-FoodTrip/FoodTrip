package com.example.FoodTripFrontend

import android.app.AlertDialog
import android.content.SharedPreferences
import android.os.Bundle
import android.util.Log
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.ListView
import android.widget.Switch
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.FoodTripFrontend.BuildConfig.SERVER_URL
import com.google.firebase.messaging.FirebaseMessaging
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException

/**
 * Activity to manage account preferences such as notifications and allergies.
 */
class AccountActivity : AppCompatActivity() {
    private val client = OkHttpClient()
    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var notificationsSwitch: Switch
    private val allergies = mutableListOf<String>()
    private lateinit var allergyAdapter: ArrayAdapter<String>

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

        // notifications switch
        notificationsSwitch.setOnCheckedChangeListener { _, isChecked ->
            saveSwitchState(isChecked)
            if (isChecked) {
                subscribeNotifications(userEmail) // subscribe (POST)
            } else {
                unsubscribeNotifications(userEmail) // unsubscribe (DELETE)
            }
        }

        // allergy list view and delete allergy
        val allergiesListView: ListView = findViewById(R.id.allergy_list)
        allergyAdapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, allergies)
        allergiesListView.adapter = allergyAdapter

        allergiesListView.setOnItemClickListener { _, _, position, _ ->
            val allergyToDelete = allergies[position]
            showDeleteConfirmationDialog(userEmail, allergyToDelete, position)
        }

        // add allergies
        val allergyInput: EditText = findViewById(R.id.allergy_input)
        val addAllergyButton: Button = findViewById(R.id.add_allergy_button)
        addAllergyButton.setOnClickListener {
            val newAllergy = allergyInput.text.toString().trim()

            if (newAllergy.isNotEmpty()) {
                addAllergy(userEmail, newAllergy)
                allergyInput.setText("")
            } else {
                Toast.makeText(this, "Please enter an allergy", Toast.LENGTH_SHORT).show()
            }
        }

        loadAllergies(userEmail)
    }

    // get current user email (for userID)
    private fun getUserEmail(): String {
        return sharedPreferences.getString("userEmail", "No email found").toString()
    }

    // save notification switch state
    private fun saveSwitchState(isEnabled: Boolean) {
        sharedPreferences.edit().putBoolean("notifications_switch_state", isEnabled).apply()
    }

    // get device fcm token
    private fun getFcmToken(callback: (String?) -> Unit) {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                task.result?.let { token ->
                    Log.d("FCM", "FCM Token: $token")
                    callback(token)
                } ?: callback(null)
            } else {
                Log.w("FCM", "Fetching FCM token failed", task.exception)
                callback(null)
            }
        }
    }

    // call backend to add fcm token
    private fun subscribeNotifications(email: String) {
        getFcmToken { fcmToken ->
            if (fcmToken != null) {
                val jsonBody = JSONObject().apply {
                    put("userID", email)
                    put("fcmToken", fcmToken)
                }
                val body = jsonBody.toString()
                    .toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

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
                                    Toast.makeText(
                                        this@AccountActivity,
                                        "Notifications updated successfully",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }
                            } else if (response.code == 400) {
                                Log.d("AccountActivity", "Already subscribed - ignoring error")
                            } else {
                                runOnUiThread {
                                    Toast.makeText(
                                        this@AccountActivity,
                                        "Failed to update notifications",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }
                            }
                        }
                    }
                })
            } else {
                Log.e("FCM", "Failed to get FCM token")
            }
        }
    }

    // call backend to remove fcm token
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

    // read all allergies from backend and update local list
    private fun loadAllergies(userEmail: String) {
        val request = Request.Builder()
            .url("${SERVER_URL}preferences/allergies/$userEmail")
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("AccountActivity", "Failed to load allergies", e)
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (response.isSuccessful) {
                        val jsonResponse = JSONArray(response.body?.string() ?: "[]")
                        allergies.clear()
                        for (i in 0 until jsonResponse.length()) {
                            allergies.add(jsonResponse.getString(i))
                        }
                        runOnUiThread { allergyAdapter.notifyDataSetChanged() }
                    }
                }
            }
        })
    }

    private fun showDeleteConfirmationDialog(userEmail: String, allergy: String, position: Int) {
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Remove Allergy")
        builder.setMessage("Are you sure you want to remove '$allergy' from your allergies?")

        builder.setPositiveButton("Delete") { _, _ ->
            removeAllergy(userEmail, allergy, position)
        }

        builder.setNegativeButton("Cancel", null)
        builder.show()
    }

    // remove allergy from backend and local list
    private fun removeAllergy(userEmail: String, allergy: String, position: Int) {
        val request = Request.Builder()
            .url("${SERVER_URL}preferences/allergies/$userEmail/$allergy")
            .delete()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("AccountActivity", "Failed to remove allergy", e)
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    runOnUiThread {
                        allergies.removeAt(position)
                        allergyAdapter.notifyDataSetChanged()
                        Toast.makeText(this@AccountActivity, "Allergy removed", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    runOnUiThread {
                        Toast.makeText(this@AccountActivity, "Failed to remove allergy", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        })
    }

    // add allergy to backend and local list
    private fun addAllergy(userEmail: String, allergy: String) {
        val jsonBody = JSONObject().apply {
            put("userID", userEmail)
            put("allergy", allergy)
        }
        val body = jsonBody.toString().toRequestBody("application/json".toMediaTypeOrNull())

        val request = Request.Builder()
            .url("${SERVER_URL}preferences/allergies")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("AccountActivity", "Failed to add allergy", e)
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    allergies.add(allergy)
                    runOnUiThread {
                        allergyAdapter.notifyDataSetChanged()
                        Toast.makeText(this@AccountActivity, "Allergy added", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        })
    }
}
