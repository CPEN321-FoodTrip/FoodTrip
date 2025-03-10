package com.example.FoodTripFrontend

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.FoodTripFrontend.GroceryStoreActivity.DiscountItem
import com.example.FoodTripFrontend.PastTripActivity.Companion
import com.example.FoodTripFrontend.PastTripActivity.TripItem
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okio.IOException

class PopTripActivity : Activity() {

    companion object {
        private const val TAG = "PastTripActivity"
    }

    data class StopLocation(
        val name: String,
        val latitude: String,
        val longitude: String,
        val population: String
    )

    data class Stop(
        val location: StopLocation,
        val distanceFromStart: Float,
        val cumulativeDistance: Float,
        val segmentPercentage: Float
    )

    data class Route(
        val _id: String,
        val userID: String,
        val start_location: PastTripActivity.LocationItem,
        val end_location: PastTripActivity.LocationItem,
        val stops: List<Stop>
    )

    lateinit var client: OkHttpClient
    lateinit var stopList: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pop_trip)

        val windowMetrics = windowManager.currentWindowMetrics
        val bounds = windowMetrics.bounds
        val width = bounds.width()
        val height = bounds.height()

        window.setLayout((width*.8).toInt(), (height*.7).toInt())

        client = OkHttpClient()
        stopList = findViewById<LinearLayout>(R.id.trip_list_layout)

        val tripID = intent.getStringExtra("tripID")
        Log.d(TAG, "$tripID is passed into here")
        if (tripID != null) {
            getTrip(tripID) {route -> processTrip(route)}
        }
    }

    private fun getTrip(tripID : String, callback: (Route) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}get-route?tripID=$tripID"
        Log.d(TAG, url)

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
                    val listType = object : TypeToken<Route>() {}.type
                    var route:Route = Gson().fromJson(json, listType)
                    callback(route)
                }
            }
        })
    }

    private fun processTrip(route: Route) {
        runOnUiThread {
            showTrip(route)
        }
    }

    private fun showTrip(route: Route) {
        stopList.removeAllViews()

        val startItemView = TextView(this)
        startItemView.textSize = 25f
        startItemView.text = "${route.start_location.name}"
        stopList.addView(startItemView)

        val stops = route.stops
        for (i in 0..(stops.count()-1)) {
            val itemView = TextView(this)

            val stop = stops[i]
            itemView.textSize = 25f
            itemView.text = "-> ${stop.location.name}"

            stopList.addView(itemView)
        }

        val endItemView = TextView(this)
        endItemView.textSize = 25f
        endItemView.text = "-> ${route.end_location.name}"
        stopList.addView(endItemView)
    }
}