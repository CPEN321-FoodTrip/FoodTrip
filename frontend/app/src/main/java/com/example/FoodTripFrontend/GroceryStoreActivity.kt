package com.example.FoodTripFrontend

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.snackbar.Snackbar
import com.google.android.material.textfield.TextInputEditText
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okio.IOException
import kotlin.math.E

/**
 * Activity to manage the discount of the store
 * (can only be accessed in admin mode)
 */
class GroceryStoreActivity : AppCompatActivity() {

    /**
     * Companion object for GroceryStoreActivity.
     * Stores static constants related to the activity.
     */
    companion object {
        private const val TAG = "GroceryStoreActivity"
    }

    private val ERROR_MESSAGE = "Unexpected code"

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

    val sampleID = "1"
    val sampleName = "store 0"

    val selectedColor = "#A5E6D9"

    lateinit var client: OkHttpClient
    lateinit var discountList: LinearLayout
    private lateinit var selectedDiscountID: String
    private lateinit var selectedDiscountView: TextView

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
        val deleteBtn = findViewById<Button>(R.id.delete_button_grocery_store)
        val inputIngredient = findViewById<TextInputEditText>(R.id.ingredient_input)
        val inputPrice = findViewById<TextInputEditText>(R.id.price_input)

        // Switch back to home page
        backBtn.setOnClickListener {
            val intent = Intent(this, MainActivityAdmin::class.java)
            startActivity(intent)
        }

        postBtn.setOnClickListener {
            val ingredient = inputIngredient.text.toString()
            val price = inputPrice.text.toString()
//            Log.d(TAG, "${ingredient} $${price}")

            if (ingredient == "" ||
                !price.matches(Regex("^[0-9]+$")) || price == "0") {
                Snackbar.make(findViewById(android.R.id.content),
                    "Please enter valid ingredient and price",
                    Snackbar.LENGTH_SHORT).show()
            } else {
                postDiscount(sampleID, sampleName, ingredient, price)
            }
        }

        deleteBtn.setOnClickListener {
            if (selectedDiscountID == "") {
                Snackbar.make(findViewById(android.R.id.content),
                    "Please select discount to be deleted",
                    Snackbar.LENGTH_SHORT).show()

            } else {
                deleteDiscount(selectedDiscountID)
            }
        }

        selectedDiscountID = ""

        // TODO: get store ID from login (use "1" as for developing)
        getDiscount(sampleID) {discounts -> processDiscount(discounts)}
    }

    private fun getDiscount(storeID : String, callback: (List<DiscountItem>) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}discounts/$storeID"
//        Log.d(TAG, url)

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
                    if (!response.isSuccessful) throw IOException("$ERROR_MESSAGE: $response")

                    val json = response.body!!.string()
                    val listType = object : TypeToken<List<DiscountItem>>() {}.type
                    var discounts:List<DiscountItem> = Gson().fromJson(json, listType)
                    callback(discounts)
                }
            }
        })
    }

    private fun postDiscount(storeID: String, storeName: String, ingredient: String, price: String) {
        val url = "${BuildConfig.SERVER_URL}discounts"
//        Log.d(TAG, url)

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
                    if (!response.isSuccessful) throw IOException("$ERROR_MESSAGE:  $response")

                    getDiscount(sampleID) {discountList -> processDiscount(discountList)}
                }
            }
        })
    }

    private fun deleteDiscount(discountID: String) {
        val url = "${BuildConfig.SERVER_URL}discounts/$selectedDiscountID"

        val request = Request.Builder()
            .url(url)
            .delete()
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                e.printStackTrace()
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) throw IOException("$ERROR_MESSAGE:    $response")

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

        for (i in 0..(discounts.count()-1)) {
            val itemView = TextView(this)

            val discount = discounts[i]
            itemView.textSize = 25f
            itemView.text = "${discount.ingredient}: $${discount.price}"

            itemView.setOnClickListener {
//                Log.d(TAG, "item $i (ID:${discount.discountID}) is clicked")
                if (selectedDiscountID == discount.discountID) {
                    selectedDiscountID = ""
                    itemView.setBackgroundColor(Color.TRANSPARENT)
//                    itemView.setBackgroundColor(Color.parseColor(unselectedColor))
                } else {
                    if (selectedDiscountID != "") {
                        selectedDiscountView.setBackgroundColor(Color.TRANSPARENT)
//                        selectedDiscountView.setBackgroundColor(Color.parseColor(unselectedColor))
                    }

                    selectedDiscountID = discount.discountID
                    itemView.setBackgroundColor(Color.parseColor(selectedColor))
                    selectedDiscountView = itemView
                }
            }

            discountList.addView(itemView)
        }
    }
}