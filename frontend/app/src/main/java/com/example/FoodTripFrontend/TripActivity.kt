package com.example.FoodTripFrontend

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray

class TripActivity : AppCompatActivity() {

    private val client = OkHttpClient()


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
        val startTextbox = findViewById<EditText>(R.id.startLocation)
        val userStartInput = startTextbox.text.toString()

        val endTextbox = findViewById<EditText>(R.id.endLocation)
        val userEndInput = endTextbox.text.toString()

        val stopsTextbox = findViewById<EditText>(R.id.numstops)
        val userNumStops = stopsTextbox.text.toString().toIntOrNull()

        var isValid = true

        GlobalScope.launch(Dispatchers.Main) {

            if (userStartInput.isNotEmpty() && !checkExistence(userStartInput)) {
                isValid = false
                Toast.makeText(this@TripActivity, "Invalid Start City", Toast.LENGTH_SHORT).show()
            }

            // Check if end city is valid
            if (userEndInput.isNotEmpty() && !checkExistence(userEndInput)) {
                isValid = false
                Toast.makeText(this@TripActivity, "Invalid End City", Toast.LENGTH_SHORT).show()
            }

            // Check if the number of stops is valid (non null and at least 1 stop)
            if (userNumStops == null || userNumStops < 1) {
                isValid = false
                Toast.makeText(this@TripActivity, "Please Enter a Valid Number of Stops", Toast.LENGTH_SHORT).show()
            }

            // If all fields are valid, proceed to the next activity
            if (isValid) {
                val intent = Intent(this@TripActivity, MainActivity::class.java)
                startActivity(intent)
            }
        }

    }

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
}