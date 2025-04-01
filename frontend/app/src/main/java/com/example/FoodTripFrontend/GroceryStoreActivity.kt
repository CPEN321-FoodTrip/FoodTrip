package com.example.FoodTripFrontend

import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
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
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.exceptions.ClearCredentialInterruptedException
import com.google.android.material.snackbar.Snackbar
import com.google.android.material.textfield.TextInputEditText
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okio.IOException

/**
 * Activity to manage the discount of the store
 * (can only be accessed in admin mode)
 */
class GroceryStoreActivity : AppCompatActivity() {

    private lateinit var sharedPreferences: SharedPreferences
    private val activityScope = CoroutineScope(Dispatchers.Main)

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

        sharedPreferences = getSharedPreferences("UserData", MODE_PRIVATE)
        val userEmail = getUserEmail()
        val userName = getUserName()

        // sign out button
        findViewById<Button>(R.id.sign_out_button).setOnClickListener() {
            Log.d(TAG, "Sign Out Button Clicked")

            // sign out user and return to login page
            val credentialManager = CredentialManager.create(this)
            activityScope.launch {
                try {
                    credentialManager.clearCredentialState(ClearCredentialStateRequest())
                    Toast.makeText(this@GroceryStoreActivity, "Logged Out Successfully",
                        Toast.LENGTH_SHORT
                    ).show()
                    goToLoginPage()
                } catch (e: ClearCredentialInterruptedException) {
                    Log.e(TAG, "Error clearing credential state", e)
                    Toast.makeText(
                        this@GroceryStoreActivity,
                        "Error clearing credentials",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }

        discountList = findViewById(R.id.discount_list_layout_store)
        val postBtn = findViewById<Button>(R.id.post_button_grocery_store)
        val deleteBtn = findViewById<Button>(R.id.delete_button_grocery_store)
        val inputIngredient = findViewById<TextInputEditText>(R.id.ingredient_input)
        val inputPrice = findViewById<TextInputEditText>(R.id.price_input)

        postBtn.setOnClickListener {
            val ingredient = inputIngredient.text.toString()
            val price = inputPrice.text.toString()

            if (ingredient == "" ||
                !price.matches(Regex("^[0-9]+$")) || price == "0") {
                Snackbar.make(findViewById(android.R.id.content),
                    "Please enter valid ingredient and price",
                    Snackbar.LENGTH_SHORT).show()
            } else {
                postDiscount(userEmail, userName, ingredient, price)
            }
        }

        deleteBtn.setOnClickListener {
            if (selectedDiscountID == "") {
                Snackbar.make(findViewById(android.R.id.content),
                    "Please select discount to be deleted",
                    Snackbar.LENGTH_SHORT).show()

            } else {
                deleteDiscount(userEmail)
            }
        }

        selectedDiscountID = ""

        getDiscount(userEmail) {discounts -> processDiscount(discounts)}
    }

    // get current user email (for storeID)
    private fun getUserEmail(): String {
        return sharedPreferences.getString("userEmail", "No email found").toString()
    }

    // get current user name (for storeName)
    private fun getUserName(): String {
        return sharedPreferences.getString("userName", "No user name found").toString()
    }

    private fun goToLoginPage() {
        val intent = Intent(this, LoginActivity::class.java)
        startActivity(intent)
        finish()
    }

    private fun getDiscount(storeID : String, callback: (List<DiscountItem>) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}discounts/$storeID"

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
                    if (!response.isSuccessful) {
                        Log.d(TAG, "No discounts for store")
                        callback(emptyList())
                    } else {
                        val json = response.body!!.string()
                        val listType = object : TypeToken<List<DiscountItem>>() {}.type
                        var discounts:List<DiscountItem> = Gson().fromJson(json, listType)
                        callback(discounts)
                    }
                }
            }
        })
    }

    private fun postDiscount(storeID: String, storeName: String, ingredient: String, price: String) {
        val url = "${BuildConfig.SERVER_URL}discounts"

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

                    getDiscount(storeID) {discountList -> processDiscount(discountList)}
                }
            }
        })
    }

    private fun deleteDiscount(storeID: String) {
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
                    selectedDiscountID = ""

                    getDiscount(storeID) {discountList -> processDiscount(discountList)}
                }
            }
        })
    }

    private fun processDiscount(discounts: List<DiscountItem>) {
//        if (discounts.isEmpty()) {
//            // TODO: indicate no discounts posted
//            return
//        }

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
                if (selectedDiscountID == discount.discountID) {
                    selectedDiscountID = ""
                    itemView.setBackgroundColor(Color.TRANSPARENT)
                } else {
                    if (selectedDiscountID != "") {
                        selectedDiscountView.setBackgroundColor(Color.TRANSPARENT)
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