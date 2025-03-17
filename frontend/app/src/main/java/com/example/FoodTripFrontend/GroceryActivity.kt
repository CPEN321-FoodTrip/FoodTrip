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
import com.google.android.material.snackbar.Snackbar
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okio.IOException

/**
 * Activity to view the ingredients required for the recipes
 * and able to view the available discount to related ingredients
 * (can only be accessed in user mode)
 */
class GroceryActivity : AppCompatActivity() {
    /**
     * Companion object for GroceryActivity.
     * Stores static constants related to the activity.
     */
    companion object {
        private const val TAG = "GroceryActivity"
    }

    /**
     * JSON format for API response in getDiscount()
     *
     * @property discountID: unique identifier of the discount
     * @property storeID: unique identifier of the store offers the discount
     * @property storeName: name of the store offers the discount
     * @property ingredient: product having the discount
     * @property price: discounted price
     */
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

        val textView1 = createTextView("beef", "ingred 1")

        textView1.setOnClickListener {
            val ingredient = (it as TextView).text.toString()
            getDiscount(ingredient) {discounts -> processDiscount(discounts)}
        }
        recipeList.addView(textView1)

        val textView2 = createTextView("pork", "ingred 2")
        textView2.setOnClickListener {
            val ingredient = (it as TextView).text.toString()
            getDiscount(ingredient) {discounts -> processDiscount(discounts)}
        }
        recipeList.addView(textView2)
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
                    if (response.code == 404) {
                        val discounts:List<DiscountItem> = emptyList()
                        callback(discounts)

                        return
                    }
                    if (!response.isSuccessful) throw IOException("Unexpected code $response")

                    val json = response.body!!.string()
                    val listType = object : TypeToken<List<DiscountItem>>() {}.type
                    var discounts:List<DiscountItem> = Gson().fromJson(json, listType)
                    callback(discounts)
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

    private fun createTextView(ingredient: String, tag: String): TextView {
        val textView = TextView(this)
        textView.textSize = 25f
        textView.text = ingredient
        textView.tag = tag

        return textView
    }

    private fun processDiscount(discounts: List<DiscountItem>) {
        if (discounts.isEmpty()) {
            runOnUiThread {
                Snackbar.make(findViewById(android.R.id.content),
                    "No discount available",
                    Snackbar.LENGTH_SHORT).show()
            }
        } else {
            showDiscount(discounts)
        }
    }
}