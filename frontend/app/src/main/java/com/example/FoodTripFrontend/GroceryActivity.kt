package com.example.FoodTripFrontend

import android.content.Context
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
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okio.IOException

class GroceryActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "GroceryActivity"
    }

    data class DiscountItem(
        val discountID: String,
        val storeID: String,
        val storeName: String,
        val ingredient: String,
        val price: Int
    )

    lateinit var client: OkHttpClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_grocery)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        client = OkHttpClient()

        val backBtn = findViewById<Button>(R.id.back_button);
        val recipeList = findViewById<LinearLayout>(R.id.recipe_list_layout)

        // Switch back to home page
        backBtn.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
        }

        val sampleStr = "ingredients"

        val _textView1 = TextView(this)
        _textView1.textSize = 25f
        _textView1.text = "beef"

        _textView1.setOnClickListener {
            val ingredient = (it as TextView).text.toString()
            Log.d(TAG, ingredient)
            getDiscount(ingredient) {discounts ->
                if (discounts.isEmpty()) {
                    runOnUiThread {
                        Toast.makeText(this, "No discount available", Toast.LENGTH_SHORT).show()
                    }
                    return@getDiscount
                }

                showDiscount(discounts)
            }
        }
        recipeList.addView(_textView1)

        val _textView2 = TextView(this)
        _textView2.textSize = 25f
        _textView2.text = "pork"

        _textView2.setOnClickListener {
            val ingredient = (it as TextView).text.toString()
            Log.d(TAG, ingredient)
            getDiscount(ingredient) {discounts ->
                if (discounts.isEmpty()) {
                    runOnUiThread {
                        Toast.makeText(this, "No discount available", Toast.LENGTH_SHORT).show()
                    }
                    return@getDiscount
                }
            }
        }
        recipeList.addView(_textView2)

        for (num in 1..30) {
            val newTextView = TextView(this)
            newTextView.textSize = 25f
            val str = sampleStr + num
            newTextView.text = str

            newTextView.setOnClickListener {
                val intent = Intent(applicationContext, PopActivity::class.java)
                startActivity(intent)
            }

            recipeList.addView(newTextView)
        }
    }

    private fun getDiscount(ingredient : String, callback: (List<DiscountItem>) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}discounts?ingredient=${ingredient}"
        Log.d(TAG, url)

        val request = Request.Builder()
            .url(url)
            .get()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                e.printStackTrace()
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) throw IOException("Unexpected code $response")

                    /*for ((name, value) in response.headers) {
                        println("$name: $value")
                    }*/

                    val json = response.body!!.string()
                    val listType = object : TypeToken<List<DiscountItem>>() {}.type
//                    Log.d(TAG, json)
                    var discounts:List<DiscountItem> = Gson().fromJson(json, listType)
                    callback(discounts)

                    /*val names = arrayListOf<String>()
                    val prices = arrayListOf<Int>()

                    for (discount in discounts) {
                        names.add(discount.storeName)
                        prices.add(discount.price)
                    }
                    val intent = Intent(applicationContext, PopActivity::class.java)
                    intent.putStringArrayListExtra("names", names)
                    intent.putIntegerArrayListExtra("prices", prices)
                    startActivity(intent)*/
                }
            }
        })
    }

    private fun showDiscount(discounts: List<DiscountItem>) {
        val names = arrayListOf<String>()
        val prices = arrayListOf<Int>()

        for (discount in discounts) {
            names.add(discount.storeName)
            prices.add(discount.price)
        }
        val intent = Intent(applicationContext, PopActivity::class.java)
        intent.putStringArrayListExtra("names", names)
        intent.putIntegerArrayListExtra("prices", prices)
        startActivity(intent)
    }
}