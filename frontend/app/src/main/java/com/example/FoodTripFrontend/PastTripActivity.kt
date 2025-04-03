package com.example.FoodTripFrontend

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.FoodTripFrontend.GroceryStoreActivity.DiscountItem
import com.google.android.material.snackbar.Snackbar
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okio.IOException

/**
 * Activity to view all the past trips of the current user
 * and view the stops and recipes associated with each trip.
 * Also allows user to display the route of the trips
 * (can only be accessed in user mode)
 */
class PastTripActivity : AppCompatActivity() {

    /**
     * Companion object for PastTripActivity.
     * Stores static constants related to the activity.
     */
    companion object {
        private const val TAG = "PastTripActivity"
    }

    /**
     * class of sub-element in class TripItem
     *
     * @property name: city name of the stop
     * @property latitude: latitude coordinate of the city
     * @property longitude: longitude coordinate of the city
     */
    data class LocationItem(
        val name: String,
        val latitude: Float,
        val longitude: Float
    )

    /**
     * JSON format for API response in getTrip()
     *
     * @property userID: unique ID of the user create the trip
     * @property start_location: starting location of the trip
     * @property end_location: destination of the trip
     * @property tripID: unique ID of the trip
     */
    data class TripItem(
        val userID: String,
        val start_location: LocationItem,
        val end_location: LocationItem,
        val tripID: String
    )


    lateinit var client: OkHttpClient
    lateinit var pastTripList: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_past_trip)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        client = OkHttpClient()

        val backBtn = findViewById<Button>(R.id.back_button_past)
        pastTripList = findViewById<LinearLayout>(R.id.past_trip_list_layout)

        backBtn.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
        }

        //use "test_person" for developing and debugging
        val sharedPref = getSharedPreferences("UserData", MODE_PRIVATE)
        val userEmail = sharedPref.getString("userEmail", "No email found")

//        val userEmail = "test_person"

        if (userEmail != null) {
            getTrip(userEmail) {trips -> processTrip(trips)}
        }
    }

    private fun getTrip(userID : String, callback: (List<TripItem>) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}users/$userID/routes"

        val request = Request.Builder()
            .url(url)
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                e.printStackTrace()
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) throw IOException("Unexpected code $response")

                    val json = response.body!!.string()
                    val listType = object : TypeToken<List<TripItem>>() {}.type
                    var trips:List<TripItem> = Gson().fromJson(json, listType)
                    callback(trips)
                }
            }
        })
    }

    private fun processTrip(trips: List<TripItem>) {
        if (trips.isEmpty()) {
            Snackbar.make(
                findViewById(android.R.id.content),
                "You haven't done any trip yet",
                Snackbar.LENGTH_SHORT
            )
            return
        }

        runOnUiThread {
            showTrip(trips)
        }
    }

    private fun showTrip(trips: List<TripItem>) {
        pastTripList.removeAllViews()

        for (i in 0..(trips.count()-1)) {
            val itemView = TextView(this)

            val trip = trips[i]
            itemView.textSize = 25f
            itemView.text = "${trip.start_location.name} -> ${trip.end_location.name}"
            itemView.tag = "route ${i+1}"
            itemView.setTextColor(Color.WHITE)

            itemView.setOnClickListener {
                val intent = Intent(applicationContext, PopTripActivity::class.java)
                Log.d(TAG, "${trip.tripID} is clicked")
                intent.putExtra("tripID", trip.tripID)
                startActivity(intent)
            }

            pastTripList.addView(itemView)
        }
    }
}