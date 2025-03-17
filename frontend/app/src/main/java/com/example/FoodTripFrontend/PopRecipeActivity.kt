package com.example.FoodTripFrontend

import android.app.Activity
import android.os.Bundle
import android.webkit.WebView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Activity showing details of the selected recipe from PopTripActivity
 */
class PopRecipeActivity : Activity() {

    lateinit var webView: WebView
    lateinit var recipeList: LinearLayout

    lateinit var name: String
    lateinit var url: String
    lateinit var ingredients: ArrayList<String>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pop_recipe)

        val windowMetrics = windowManager.currentWindowMetrics
        val bounds = windowMetrics.bounds
        val width = bounds.width()
        val height = bounds.height()

        window.setLayout((width*.8).toInt(), (height*.7).toInt())

        name = intent.getStringExtra("recipeName").toString()
        url = intent.getStringExtra("url").toString()
        ingredients = intent.getStringArrayListExtra("ingredients")!!

        recipeList = findViewById(R.id.recipe_list_layout)

        showRecipe()
    }

    private fun showRecipe() {
        recipeList.removeAllViews()

        val nameTextView = TextView(this)
        nameTextView.textSize = 25f
        nameTextView.text = "$name"
        recipeList.addView(nameTextView);

        if (url != null) {
            val urlTextView = TextView(this)
            urlTextView.textSize = 25f
            urlTextView.text = "$url"
            urlTextView.tag = "url"
            urlTextView.setOnClickListener {
                webView = WebView(this)
                webView.tag = "recipe web"
                webView.settings.javaScriptEnabled = true
                webView.settings.domStorageEnabled = true
                findViewById<ConstraintLayout>(R.id.main).addView(webView)
                webView.loadUrl(url)
            }

            recipeList.addView(urlTextView)
        }


        if (ingredients != null) {
            for (i in 0..<ingredients.count()) {
                val newTextView = TextView(this)
                newTextView.textSize = 25f
                newTextView.text = "${ingredients[i]}"
                recipeList.addView(newTextView);
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.parent != null) {
            findViewById<ConstraintLayout>(R.id.main).removeView(webView)

            showRecipe()
        } else {
            super.onBackPressed()
        }
    }
}