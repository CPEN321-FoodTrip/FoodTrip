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

class PopActivity : Activity() {

    companion object {
        private const val TAG = "GroceryActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pop)

        val windowMetrics = windowManager.currentWindowMetrics
        val bounds = windowMetrics.bounds
        val width = bounds.width()
        val height = bounds.height()

        window.setLayout((width*.8).toInt(), (height*.7).toInt())

        val discountList = findViewById<LinearLayout>(R.id.discount_list_layout)
        val sampleStr = "discount"

        for (num in 1..30) {
            val newTextView = TextView(this)
            newTextView.textSize = 25f
            val str = sampleStr + num
            newTextView.text = str

            discountList.addView(newTextView);
        }
    }
}