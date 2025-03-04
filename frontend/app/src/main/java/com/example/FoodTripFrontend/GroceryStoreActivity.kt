package com.example.FoodTripFrontend

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.FoodTripFrontend.GroceryActivity.Companion
import com.example.FoodTripFrontend.GroceryActivity.DiscountItem
import com.google.android.material.textfield.TextInputEditText
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.Call
import okhttp3.Callback
import okhttp3.FormBody
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okio.IOException

class GroceryStoreActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "GroceryStoreActivity"
    }

    data class DiscountItem(
        val discountID: String,
        val storeID: String,
        val storeName: String,
        val ingredient: String,
        val price: Int
    )

    val sampleID = "1"
    val sampleName = "store 0"

    lateinit var client: OkHttpClient
    lateinit var discountList: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_grocery_store)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        client = OkHttpClient()

        val backBtn = findViewById<Button>(R.id.back_button_grocery_store)
        discountList = findViewById<LinearLayout>(R.id.discount_list_layout_store)
        val postBtn = findViewById<Button>(R.id.post_button_grocery_store)
        val inputIngredient = findViewById<TextInputEditText>(R.id.ingredient_input)
        val inputPrice = findViewById<TextInputEditText>(R.id.price_input)

        // Switch back to home page
        backBtn.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
        }

        postBtn.setOnClickListener {
            val ingredient = inputIngredient.text.toString()
            val price = inputPrice.text.toString()
//            Log.d(TAG, "${ingredient} $${price}")

            postDiscount(sampleID, sampleName, ingredient, price)
        }

        // TODO: get store ID from login (use "1" as for developing)
        getDiscount(sampleID) {discounts -> processDiscount(discounts)}
    }

    private fun getDiscount(storeID : String, callback: (List<DiscountItem>) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}discount?storeID=${storeID}"
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

                    val json = response.body!!.string()
                    val listType = object : TypeToken<List<DiscountItem>>() {}.type
                    var discounts:List<DiscountItem> = Gson().fromJson(json, listType)
                    callback(discounts)
                }
            }
        })
    }

    private fun postDiscount(storeID: String, storeName: String, ingredient: String, price: String) {
        val url = "${BuildConfig.SERVER_URL}discount"
        Log.d(TAG, url)

        val jsonBody = """
                {
                    "storeID": "$storeID",
                    "storeName": "$storeName",
                    "ingredient": "$ingredient",
                    "price": $price
                }
            """.trimIndent()

        val body = jsonBody.toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url(url)
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                e.printStackTrace()
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) throw IOException("Unexpected code $response")

                    getDiscount(sampleID) {discountList -> processDiscount(discountList)}
                }
            }
        })
    }

    private fun processDiscount(discounts: List<DiscountItem>) {
        if (discounts.isEmpty()) {
            // TODO: indicate no discounts posted
            return
        }

        runOnUiThread {
            showDiscount(discounts)
        }
    }

    private fun showDiscount(discounts: List<DiscountItem>) {
        discountList.removeAllViews()

        val names = arrayListOf<String>()
        val prices = arrayListOf<Int>()

        for (discount in discounts) {
            names.add(discount.ingredient)
            prices.add(discount.price)
        }

        for (i in 0..(names.count()-1)) {
            val newTextView = TextView(this)
            newTextView.textSize = 25f
            newTextView.text = "${names[i]} $${prices[i]}"

            discountList.addView(newTextView)
        }
    }
}