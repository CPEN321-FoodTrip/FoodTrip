package com.example.FoodTripFrontend

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.exceptions.*
import androidx.fragment.app.FragmentContainerView
import com.example.FoodTripFrontend.BuildConfig.SERVER_URL
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.gms.maps.model.Polyline
import com.google.android.gms.maps.model.PolylineOptions
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.util.ArrayList

/**
 * Home page of the app in user mode
 *
 * Direction of buttons:
 * - Manage Trip -> TripActivity
 * - View Past Trip -> PastTripActivity
 * - Manage Account -> AccountActivity
 * - View Recipes -> Grocery Activity
 * - Sign Out: log out and back to LoginActivity
 */
class MainActivity : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var mMap: GoogleMap
    private val client = OkHttpClient()
    private var currentTripID = ""
    /**
     * Companion object for MainActivity.
     * Stores static constants related to the activity.
     */
    companion object {
        private const val TAG = "MainActivity"
    }

    private val activityScope = CoroutineScope(Dispatchers.Main)


    private val requestPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                Log.d(TAG, "Notification permission granted!")
                fetchFCMToken() // Fetch token after permission is granted
            } else {
                Log.w(TAG, "Notification permission denied.")
            }
        }


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestNotificationPermission()
            } else {
                fetchFCMToken()
            }
        } else {
            fetchFCMToken()
        }
        
        //Map fragment instead of Map activity to maintain functionality of a "main page" and the
        //ability to turn the map on and off as needed
        val mapFragment = supportFragmentManager
            .findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)

        //sets up onClick listeners for generic buttons
        setUpButtons()

        findViewById<Button>(R.id.sign_out_button).setOnClickListener() {
            Log.d(TAG, "Sign Out Button Clicked")

            //Signs out the user and returns them to the login page
            val credentialManager = CredentialManager.create(this)
            activityScope.launch {
                try {
                    credentialManager.clearCredentialState(ClearCredentialStateRequest())
                    Toast.makeText(
                        this@MainActivity,
                        "Logged Out Successfully",
                        Toast.LENGTH_SHORT
                    ).show()
                    gotologin()
                } catch (e: ClearCredentialInterruptedException) {
                    Log.e(TAG, "Error clearing credential state", e)
                    Toast.makeText(
                        this@MainActivity,
                        "Error clearing credentials",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }

    }

    //temp function for Notifications
    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private fun fetchFCMToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w(TAG, "Fetching FCM token failed", task.exception)
            } else {
                val token = task.result
                Log.d(TAG, "FCM Token: $token")
            }
        }
    }

    fun setUpButtons() {
        findViewById<Button>(R.id.PastTrips).setOnClickListener() {
            val intent = Intent(this, PastTripActivity::class.java)
            startActivity(intent)
        }

        findViewById<Button>(R.id.ManageTrip).setOnClickListener() {
            val intent = Intent(this, TripActivity::class.java)
            startActivity(intent)
        }

        findViewById<Button>(R.id.ManageAccount).setOnClickListener() {
            val intent = Intent(this, AccountActivity::class.java)
            startActivity(intent)
        }

        findViewById<Button>(R.id.viewRecipes).setOnClickListener() {
            val intent = Intent(this, GroceryActivity::class.java)
            startActivity(intent)
        }
    }


    override fun onMapReady(googleMap: GoogleMap) {

        mMap = googleMap
        //Gets a coordinate list passed from Trip Activities which is then displayed with a polyline
        //Only shows the map when a route and coordinates are entered
        //coordsList and nameList are sent as bundles from other activities
        val tripID = intent.getStringExtra("tripId")
        Log.d(TAG, "Running Map")
        if (tripID != null) {
            currentTripID = tripID
            Log.d(TAG, currentTripID)
            CoroutineScope(Dispatchers.IO).launch {

                val request = Request.Builder()
                    .url("${SERVER_URL}routes/$tripID")
                    .addHeader("Content-Type", "application/json")
                    .build()

                try {
                    val response = client.newCall(request).execute()

                    //if a route is successfully returned, the data for the route is collected
                    if (response.isSuccessful) {
                        val responseBody = response.body?.string()
                        Log.d(TAG, "Response: $responseBody")
                        withContext(Dispatchers.Main) {
                            genMap(mMap, responseBody)
                        }
                    } else {
                        Log.e(TAG, "Error: ${response.code}")
                    }


                } catch (e: IOException) {
                    Log.e(TAG, "Exception: ${e.message}")
                }

            }
        } else {
            Log.e(TAG, "TripID is null")
        }
    }

    private fun genMap(googleMap: GoogleMap, response : String?) {
        mMap = googleMap
        val longName = "longitude"
        val latName = "latitude"

        if (response != null) {
            try {
                val jsonObject = JSONObject(response)
                val coordsList = mutableListOf<LatLng>()
                val nameList = mutableListOf<String>()

                val startLocation = jsonObject.getJSONObject("start_location")
                val startName = startLocation.getString("name")
                val startLat = startLocation.getDouble(latName)
                val startLong = startLocation.getDouble(longName)
                Log.d(TAG, "Start Location: $startLat, $startLong")

                coordsList.add(LatLng(startLat, startLong))
                nameList.add(startName)

                val endLocation = jsonObject.getJSONObject("end_location")
                val endName = endLocation.getString("name")
                val endLat = endLocation.getDouble(latName)
                val endLong = endLocation.getDouble(longName)

                val arrayOfStops: JSONArray = jsonObject.getJSONArray("stops")
                Log.d(TAG, "${arrayOfStops.length()}")
                for (i in 0 until arrayOfStops.length()) {
                    val stop = arrayOfStops.getJSONObject(i)
                    val location = stop.getJSONObject("location")
                    val city = location.getString("name")
                    val lat = location.getDouble(latName)
                    val long = location.getDouble(longName)

                    coordsList.add(LatLng(lat, long))
                    nameList.add(city)

                    Log.d(TAG, "Stop $i: $lat, $long")
                }

                coordsList.add(LatLng(endLat, endLong))
                nameList.add(endName)
                Log.d(TAG, "End Location: $endLat, $endLong")


                //coordinates for testing purposes
//            val points = listOf(
//                LatLng(37.7749, -122.4194), // San Francisco
//                LatLng(34.0522, -118.2437), // Los Angeles
//                LatLng(36.1699, -115.1398)  // Las Vegas
//            )

                val mapFragment = findViewById<FragmentContainerView>(R.id.map)

                Log.d(TAG, "Found Map")

                if (mapFragment.visibility == android.view.View.GONE) {
                    mapFragment.visibility = android.view.View.VISIBLE
                }

                Log.d(TAG, "Map made visible")

                //polyline only draws straight lines, ideally in release this should change to
                //actual routes (ie. roads, highways)
                val polylineOptions = PolylineOptions()
                    .addAll(coordsList)
                    .width(5f)
                    .color(0xFF0000FF.toInt())

                mMap.addPolyline(polylineOptions)

                for (i in coordsList.indices) {
                    val marker = mMap.addMarker(MarkerOptions().position(coordsList[i]).title(nameList[i]))
                    marker?.showInfoWindow()
                }

                Log.d(TAG, "Map is ready and displayed")

                val builder = LatLngBounds.Builder()
                coordsList.forEach { builder.include(it) }
                val bounds = builder.build()
                val padding = 100
                val cameraUpdate = CameraUpdateFactory.newLatLngBounds(bounds, padding)
                mMap.moveCamera(cameraUpdate)

            } catch (e : JSONException) {
                Log.e(TAG, "Error parsing JSON response: ${e.message}")
            }
        } else {
            Log.e(TAG, "Response is null")
        }
    }

    private fun gotologin() {
        val intent = Intent(this, LoginActivity::class.java)
        startActivity(intent)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        activityScope.cancel()
    }
}