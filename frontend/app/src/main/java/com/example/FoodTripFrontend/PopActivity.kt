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

/**
 * Activity showing available discounts to the selected ingredient
 */
class PopActivity : Activity() {

    /**
     * Companion object for GroceryActivity.
     * Stores static constants related to the activity.
     */
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

        val names = intent.getStringArrayListExtra("names")
        val prices = intent.getIntegerArrayListExtra("prices")

        val discountList = findViewById<LinearLayout>(R.id.discount_list_layout)

        if (names != null && prices != null) {
            if (prices.count() == names.count()) {
                for (i in 0..(names.count()-1)) {
                    val newTextView = TextView(this)
                    newTextView.textSize = 25f
                    newTextView.text = "${names[i]} $${prices[i]}"
                    newTextView.tag = "discount ${i+1}"

                    discountList.addView(newTextView);
                }
            }
        }
    }
}