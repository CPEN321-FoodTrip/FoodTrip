package com.example.FoodTripFrontend

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.LinearLayout
import android.widget.PopupMenu
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class GroceryActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "GroceryActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_grocery)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        val backBtn = findViewById<Button>(R.id.back_button);
        val recipeList = findViewById<LinearLayout>(R.id.recipe_list_layout)

        // Switch back to home page
        backBtn.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
        }

        val sampleStr = "ingredients"

        for (num in 1..30) {
            val newTextView = TextView(this)
            newTextView.textSize = 25f
            val str = sampleStr + num
            newTextView.text = str

            newTextView.setOnClickListener {
                val intent = Intent(applicationContext, PopActivity::class.java)
                startActivity(intent)
            }

            recipeList.addView(newTextView);
        }
    }
}