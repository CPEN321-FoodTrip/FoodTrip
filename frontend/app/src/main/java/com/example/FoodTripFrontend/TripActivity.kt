package com.example.FoodTripFrontend

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.FoodTripFrontend.BuildConfig.SERVER_URL
import com.example.FoodTripFrontend.GroceryActivity.Companion
import com.example.FoodTripFrontend.recyclerViewHelper.itemClass.RecipeItem
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
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import org.json.JSONException
import java.util.ArrayList
import java.util.LinkedList
import java.util.Queue

/**
 * Activity that manages current trip.
 *
 * This activity handles generation of a new trip with start/end locations
 * and number of intermediate stops.
 *
 */
class TripActivity : AppCompatActivity() {

    private val client = OkHttpClient()

    private var snackbarQueue: Queue<String> = LinkedList()
    private var isSnackbarShowing = false
    lateinit var globalData : GlobalData
    private val ERROR_MESSAGE = "Unexpected code"



    /**
     * Companion object for TripActivity.
     * Stores static constants related to the activity.
     */
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

        globalData = application as GlobalData


        findViewById<Button>(R.id.CreateTrip).setOnClickListener() {
            collectParameters()
        }

        val backBtn = findViewById<Button>(R.id.back_button)
        backBtn.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
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
                Log.d(TAG, "in if")
                isValid = false
                showSnackbar(findViewById(android.R.id.content), "Invalid Start City")
            }

            // Check if end city is valid
            if (userEndInput.isNotEmpty() && !checkExistence(userEndInput)) {
                isValid = false
                showSnackbar(findViewById(android.R.id.content), "Invalid End City")
            }

            // Check if start and end city are the same
            if (userStartInput == userEndInput) {
                isValid = false
                showSnackbar(findViewById(android.R.id.content), "Route Cannot Have Same Start/End")
            }

            //Check if start or end city is missing
            if (userStartInput.isEmpty()) {
                isValid = false
                showSnackbar(findViewById(android.R.id.content), "Missing Start City")
            } else if (userEndInput.isEmpty()) {
                Log.d(TAG,"In missing end")
                isValid = false
                showSnackbar(findViewById(android.R.id.content), "Missing End City")
            }

            if (userNumStops == null) {
                Log.d(TAG,"In numStopsEmpty")
                isValid = false
                showSnackbar(findViewById(android.R.id.content), "Missing Number of Stops")
            }

            // Check if the number of stops is valid (non null and at least 1 stop but less than 10)
            if ((userNumStops != null && userNumStops < 1) || (userNumStops != null && userNumStops > 10)) {
                Log.d(TAG,"In numStops invalid")
                isValid = false
                showSnackbar(findViewById(android.R.id.content), "Invalid Number of Stops")
            }


            // If all fields are valid, proceed to the next activity
            if (isValid) {
                //Use "test_person" for developing and debugging
                val sharedPref = getSharedPreferences("UserData", MODE_PRIVATE)
                val userEmail = sharedPref.getString("userEmail", "No email found")
//                val userEmail = "test_person"

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
            } catch (e: IOException) {
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
                    if (response.code == 503) {
                        showSnackbar(findViewById(android.R.id.content), "Service unavailable, try again later")
                    }
                    Log.e(TAG, "Error: ${response.code}")
                }


            } catch (e: IOException) {
                Log.e(TAG, "Exception: ${e.message}")
            }

        }
    }

    //Takes the response from the back end and sends the tripID to mainActivity to be processed
    private fun collectRoute(response : String?) {
        if (response != null) {
            CoroutineScope(Dispatchers.Main).launch {
                try {
                    val jsonObject = JSONObject(response)
                    val tripID = jsonObject.getString("tripID")

                    val recipeSuccess = createRecipe(tripID, globalData.userID)

                    if (recipeSuccess) {
                        val intent = Intent(this@TripActivity, MainActivity::class.java)
                        intent.putExtra("tripId", tripID)
                        Log.d(TAG, "Trip ID : $tripID")
                        startActivity(intent)
                    } else {
                        Log.d(TAG, "Recipe generation failed, staying on the input screen.")
                    }

                } catch (e: JSONException) {
                    Log.e(TAG, "Error parsing JSON response: ${e.message}")
                }

            }
        } else {
            Log.e(TAG, "Response is null")
        }
    }

//    private suspend fun createRecipe(tripID: String, userID: String): Boolean {
//        return withContext(Dispatchers.IO) {
//            val url = "${SERVER_URL}recipes"
//            val jsonBody = """
//            {
//                "tripID": "$tripID",
//                "userID": "$userID"
//            }
//        """.trimIndent()
//
//            val body = jsonBody.toRequestBody("application/json; charset=utf-8".toMediaType())
//
//            val request = Request.Builder()
//                .url(url)
//                .post(body)
//                .build()
//
//            try {
//                val response = client.newCall(request).execute()
//                response.use {
//                    if (response.code == 404) {
//                        deleteTrip(tripID)
//
//                        runOnUiThread {
//                            showSnackbar(findViewById(android.R.id.content), "Recipes could not be found. Please resubmit.")
//                        }
//                        return@withContext false
//                    }
//                    if (!response.isSuccessful) {
//                        runOnUiThread {
//                            showSnackbar(findViewById(android.R.id.content), "An error occurred: ${response.message}")
//                        }
//                        return@withContext false
//                    }
//                }
//                return@withContext true
//            } catch (e: IOException) {
//                runOnUiThread {
//                    showSnackbar(findViewById(android.R.id.content), "Network error. Please try again.")
//                }
//                return@withContext false
//            }
//        }
//    }

    private suspend fun createRecipe(tripID: String, userID: String): Boolean = withContext(Dispatchers.IO) {
        val url = "${SERVER_URL}recipes"
        val jsonBody = """
        {
            "tripID": "$tripID",
            "userID": "$userID"
        }
    """.trimIndent()

        val body = jsonBody.toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url(url)
            .post(body)
            .build()

        try {
            client.newCall(request).execute().use { response ->
                when {
                    response.code == 404 -> {
                        deleteTrip(tripID)
                        runOnUiThread {
                            showSnackbar(findViewById(android.R.id.content), "Recipes could not be found. Please resubmit.")
                        }
                        false
                    }
                    !response.isSuccessful -> {
                        runOnUiThread {
                            showSnackbar(findViewById(android.R.id.content), "An error occurred: ${response.message}")
                        }
                        false
                    }
                    else -> true
                }
            }
        } catch (e: IOException) {
            runOnUiThread {
                showSnackbar(findViewById(android.R.id.content), "Network error. Please try again.")
            }
            false
        }
    }


    private suspend fun deleteTrip(tripID: String) {
        withContext(Dispatchers.IO) {
            val url = "${SERVER_URL}routes/$tripID"

            val request = Request.Builder()
                .url(url)
                .delete()
                .build()

            try {
                val response = client.newCall(request).execute()
                if (!response.isSuccessful) {
                    Log.e(TAG, "Failed to delete trip: ${response.code}")
                } else {
                    Log.d(TAG, "Trip deleted successfully")
                }
            } catch (e: IOException) {
                Log.e(TAG, "Exception while deleting trip: ${e.message}")
            }
        }
    }

    fun showSnackbar(view: View, message: String) {
        snackbarQueue.add(message)

        if (!isSnackbarShowing) {
            displayNextSnackbar(view)
        }
    }

    fun displayNextSnackbar(view: View) {
        if (snackbarQueue.isNotEmpty()) {
            isSnackbarShowing = true
            val message = snackbarQueue.poll()
            val snackbar = Snackbar.make(view, message, Snackbar.LENGTH_SHORT)
            snackbar.addCallback(object : Snackbar.Callback() {
                override fun onDismissed(snackbar: Snackbar?, event: Int) {
                    super.onDismissed(snackbar, event)
                    isSnackbarShowing = false
                    displayNextSnackbar(view)
                }
            })
            snackbar.show()
        }
    }
}