package com.example.FoodTripFrontend

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.FoodTripFrontend.BuildConfig.SERVER_URL
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException
import org.json.JSONArray
import org.json.JSONObject
import com.google.android.gms.maps.model.LatLng
import com.google.android.material.snackbar.Snackbar
import java.util.ArrayList

class TripActivity : AppCompatActivity() {

    private val client = OkHttpClient()

    companion object {
        private const val TAG = "TripActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_trip)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        findViewById<Button>(R.id.CreateTrip).setOnClickListener() {
            collectParameters()
        }
    }

    private fun collectParameters() {

        //Gets the user submitted input for start and end locations, as well as number of desired
        //stops
        val startTextbox = findViewById<EditText>(R.id.startLocation)
        val userStartInput = startTextbox.text.toString()

        val endTextbox = findViewById<EditText>(R.id.endLocation)
        val userEndInput = endTextbox.text.toString()

        val stopsTextbox = findViewById<EditText>(R.id.numstops)
        val userNumStops = stopsTextbox.text.toString().toIntOrNull()


        var isValid = true

        //Checks if each input is given a valid response, will only make a call to create a route
        //if all fields are valid, otherwise it leave a Toast message telling
        //the user which fields are invalid and allows them to resubmit
        GlobalScope.launch(Dispatchers.Main) {

            //Check if starting city is valid
            if (userStartInput.isNotEmpty() && !checkExistence(userStartInput)) {
                isValid = false
                Snackbar.make(findViewById(android.R.id.content), "Invalid Start City", Snackbar.LENGTH_SHORT).show()
            }

            // Check if end city is valid
            if (userEndInput.isNotEmpty() && !checkExistence(userEndInput)) {
                isValid = false
                Snackbar.make(findViewById(android.R.id.content), "Invalid End City", Snackbar.LENGTH_SHORT).show()
            }

            // Check if the number of stops is valid (non null and at least 1 stop)
            if (userNumStops == null || userNumStops < 1) {
                isValid = false
                Snackbar.make(findViewById(android.R.id.content), "Invalid Number of Stops", Snackbar.LENGTH_SHORT).show()
            }

            // If all fields are valid, proceed to the next activity
            if (isValid) {

                val sharedPref = getSharedPreferences("UserData", MODE_PRIVATE)
                val userEmail = sharedPref.getString("userEmail", "No email found")

                Log.d(TAG, "User Email: $userEmail")

                val json = JSONObject()
                json.put("userID", userEmail)
                json.put("origin", userStartInput)
                json.put("destination", userEndInput)
                json.put("numStops", userNumStops)

                getRoute(json)
            }
        }

    }


    //Asynchronous function that uses an external api to check if the given city name is valid
    //The city name is given to a call to the api, where it then returns a string for valid cities
    //and an empty string for invalid cities.
    private suspend fun checkExistence(cityName: String): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                val url = "https://nominatim.openstreetmap.org/search?city=$cityName&format=json&limit=1"

                val request = Request.Builder().url(url).build()
                val response = client.newCall(request).execute()

                val jsonResponse = response.body?.string()
                val jsonArray = JSONArray(jsonResponse)

                jsonArray.length() > 0
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
    }

    //Calls the backend to provide a "route" in the form of a set of coordinates
    //Provides to the back end the userID (google sign in email), the start location, end location
    //and number of stops (stored in requestBody as a json)
    private fun getRoute(json: JSONObject){
        CoroutineScope(Dispatchers.IO).launch{

            val requestBody = json.toString().toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url("${SERVER_URL}routes")
                .post(requestBody)
                .addHeader("Content-Type", "application/json")
                .build()

            try {
                val response = client.newCall(request).execute()

                //if a route is successfully returned, the data for the route is collected
                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    Log.d(TAG, "Response: $responseBody")
                    collectRoute(responseBody)
                } else {
                    Log.e(TAG, "Error: ${response.code}")
                }


            } catch (e: IOException) {
                Log.e(TAG, "Exception: ${e.message}")
            }

        }
    }

    //Takes the response from the back end and creates a list of the route coordinates and
    //corresponding city names. Puts them into an arraylist and sends them to the main activity
    //to be displayed on the map in MainActivity. Then returns back to main activity.
    private fun collectRoute(response : String?) {
        if (response != null) {
            try {
                val jsonObject = JSONObject(response)
                val coordsList = mutableListOf<LatLng>()
                val nameList = mutableListOf<String>()


                val startLocation = jsonObject.getJSONObject("start_location")
                val startName = startLocation.getString("name")
                val startLat = startLocation.getDouble("latitude")
                val startLong = startLocation.getDouble("longitude")
                Log.d(TAG, "Start Location: $startLat, $startLong")

                coordsList.add(LatLng(startLat, startLong))
                nameList.add(startName)

                val endLocation = jsonObject.getJSONObject("end_location")
                val endName = endLocation.getString("name")
                val endLat = endLocation.getDouble("latitude")
                val endLong = endLocation.getDouble("longitude")

                val arrayOfStops: JSONArray = jsonObject.getJSONArray("stops")

                for (i in 0 until arrayOfStops.length()) {
                    val stop = arrayOfStops.getJSONObject(i)
                    val location = stop.getJSONObject("location")
                    val city = location.getString("name")
                    val lat = location.getDouble("latitude")
                    val long = location.getDouble("longitude")

                    coordsList.add(LatLng(lat, long))
                    nameList.add(city)

                    Log.d(TAG, "Stop $i: $lat, $long")
                }

                coordsList.add(LatLng(endLat, endLong))
                nameList.add(endName)

                val intent = Intent(this@TripActivity, MainActivity::class.java)
                val bundle = Bundle()
                bundle.putParcelableArrayList("coordinates", ArrayList(coordsList))
                bundle.putStringArrayList("cities", ArrayList(nameList))
                intent.putExtras(bundle)
                startActivity(intent)

            } catch (e : Exception) {
                Log.e(TAG, "Error parsing JSON response: ${e.message}")
            }
        } else {
            Log.e(TAG, "Response is null")
        }
    }
}