package com.example.FoodTripFrontend

import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import com.google.android.material.snackbar.Snackbar

/**
 * Activity showing details of the selected recipe from PopTripActivity
 */
class PopRecipeActivity : AppCompatActivity() {

    lateinit var webView: WebView
    lateinit var recipeList: LinearLayout
    var isClosing = false

    lateinit var name: String
    lateinit var url: String
    var ingredients: ArrayList<String> ?= null
    lateinit var from: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pop_recipe)

        val windowMetrics = windowManager.currentWindowMetrics
        val bounds = windowMetrics.bounds
        val width = bounds.width()
        val height = bounds.height()

        window.setLayout((width*.8).toInt(), (height*.7).toInt())

        name = intent.getStringExtra("recipeName") ?: ""
        url = intent.getStringExtra("url") ?: ""
        ingredients = intent.getStringArrayListExtra("ingredients")
        from = intent.getStringExtra("from") ?: ""

        recipeList = findViewById(R.id.recipe_list_layout)

        showRecipe()
    }

    private fun showRecipe() {
        recipeList.removeAllViews()

        if (name.isNotEmpty()) {
            val nameTextView = TextView(this)
            nameTextView.textSize = 25f
            nameTextView.typeface = Typeface.DEFAULT_BOLD
            nameTextView.text = name
            recipeList.addView(nameTextView);
            Log.d("temp", "name is printed")
        }

        if (!ingredients.isNullOrEmpty()) {
            for (i in 0..<ingredients!!.count()) {
                val newTextView = TextView(this)
                newTextView.setPadding(10, 0, 0, 10)
                newTextView.textSize = 20f
                newTextView.text = ingredients!![i]
                newTextView.tag = "ingred ${i+1}"
                recipeList.addView(newTextView);
            }
        }

        if (url.isNotEmpty()) {
            if (from == "grocery") {
                createWebView(url)
            } else {
                val urlButtonView = Button(this)
                urlButtonView.setPadding(5, 5, 5, 10)
                urlButtonView.textSize = 12f
                urlButtonView.text = "View Recipe"
                urlButtonView.tag = "url"
                urlButtonView.setBackgroundColor(Color.parseColor("#4db2c4"))
                urlButtonView.setTextColor(Color.WHITE)
                urlButtonView.setOnClickListener {
                    Log.d("PopRecipe", "Clicked")
                    createWebView(url)
                }
                recipeList.addView(urlButtonView)
            }
        }
    }

    private fun createWebView(url: String) {
        Log.d("PopRecipe", "url: $url")

        webView = WebView(this)
        webView.tag = "recipe web"
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true

        webView.webViewClient = object : WebViewClient() {
            // Handle network error
            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                val rootView = window.decorView.rootView
                when (error?.errorCode) {
                    -2 -> {
                        Snackbar.make(rootView, "Connection error! Some contents may not load", Snackbar.LENGTH_LONG).show()
                    }
                    -6 -> {
                        Snackbar.make(rootView, "Failed to Connect", Snackbar.LENGTH_LONG).show()
                        Handler(Looper.getMainLooper()).postDelayed({
                            onBackPressed()
                        }, 2000)
                    }
                    -8 -> {
                        Snackbar.make(rootView, "Connection Timed Out", Snackbar.LENGTH_LONG).show()
                        Handler(Looper.getMainLooper()).postDelayed({
                            onBackPressed()
                        }, 2000)
                    }
                }
                Log.d("PopRecipe", "Network Error: ${error?.description} (${error?.errorCode})")
            }
        }

        findViewById<ConstraintLayout>(R.id.main).addView(webView)
        webView.loadUrl(url)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (from == "grocery") {
            if (isClosing) return
            isClosing = true
            finish()
        }
        if (::webView.isInitialized && webView.parent != null) {
            findViewById<ConstraintLayout>(R.id.main).removeView(webView)
        } else {
            super.onBackPressed()
        }
    }
}