package com.example.FoodTripFrontend

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class PastTripActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "GroceryActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_past_trip)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        val backBtn = findViewById<Button>(R.id.back_button_past)
        val pastTripList = findViewById<LinearLayout>(R.id.past_trip_list_layout)

        backBtn.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
        }

        val _sampleStr = "trip"

        for (num in 1..30) {
            val newTextView = TextView(this)
            newTextView.textSize = 25f
            val str = _sampleStr + num
            newTextView.text = str

            newTextView.setOnClickListener {
                val _text = "show past trip route and details $num"
                Toast.makeText(this, _text, Toast.LENGTH_SHORT).show()
            }

            pastTripList.addView(newTextView);
        }
    }
}