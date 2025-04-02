package com.example.FoodTripFrontend

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.FoodTripFrontend.recyclerViewHelper.adapter.RecipeAdapter
import com.example.FoodTripFrontend.recyclerViewHelper.itemClass.*
import com.google.android.material.snackbar.Snackbar
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

    private val ERROR_MESSAGE = "Unexpected code"

    private val sampleTripID = "67eaa53f02fdf04413318b3a"
    private val sampleUserID = "test_person"

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

    /**
     * class of sub-element in class RecipeItem
     *
     * @property text: full text of ingredient description
     * @property quantity: amount of ingredient needed
     * @property measure: unit of the amount
     * @property food: name of the ingredient
     * @property weight: net weight of the ingredient
     * @property foodId: unique ID of the ingredient
     */
    data class Ingredient(
        val text: String,
        val quantity: Number,
        val measure: String,
        val food: String,
        val weight: Number,
        val foodId: String
    )

    /**
     * JSON format for API response in getRecipes()
     *
     * @property hits: list of recipes
     */
    data class EdamamResponse (
        val hits: List<RecipeItem>
    )

    lateinit var client: OkHttpClient
    lateinit var globalData : GlobalData

    lateinit var recipeList: LinearLayout
    lateinit var recyclerView: RecyclerView

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
        globalData = application as GlobalData

        val backBtn = findViewById<Button>(R.id.back_button);
        recipeList = findViewById<LinearLayout>(R.id.recipe_list_layout)
        recyclerView = findViewById<RecyclerView>(R.id.recipeRecyclerView)

        // Switch back to home page
        backBtn.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
        }

        if (globalData.currentTripID != "") {
            getRecipe(globalData.currentTripID, globalData.userID) { recipes ->
                processRecipe(recipes)
            }
        } else {
            Snackbar.make(
                window.decorView.rootView,
                "Please first plan your trip",
                Snackbar.LENGTH_SHORT
            )
        }
    }

    private fun getRecipe(tripID: String, userID: String, callback: (List<RecipeItem>) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}recipes/$tripID"
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
                    // 404 not found for existing recipe to provided tripID, then create one
                    if (response.code == 404) {
                        callback(emptyList())

                        return
                    }
                    if (!response.isSuccessful) throw IOException("$ERROR_MESSAGE $response")

                    val json = response.body!!.string()
                    val listType = object : TypeToken<List<RecipeItem>>() {}.type
                    val recipes:List<RecipeItem> = Gson().fromJson(json, listType)
                    callback(recipes)
                }
            }
        })
    }

    private fun processRecipe(recipes: List<RecipeItem>) {
        if (recipes.isEmpty()) {
            Log.d(TAG, "Recipes has not created. Creating...")
            createRecipe(globalData.currentTripID, globalData.userID) { _recipes ->
                showRecipe(_recipes)
            }
        } else {
            showRecipe(recipes)
        }
    }

    private fun showRecipe(recipes: List<RecipeItem>) {
        runOnUiThread {
            recyclerView.layoutManager = LinearLayoutManager(this)

            val adapter = RecipeAdapter(recipes)
            recyclerView.adapter = adapter
        }
    }

    private fun createRecipe(tripID: String, userID: String, callback: (List<RecipeItem>) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}recipes"

        val jsonBody = """
                {
                    "tripID": "$tripID",
                    "userID": "$userID"
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

                    val json = response.body!!.string()
                    val listType = object : TypeToken<List<RecipeItem>>() {}.type
                    var recipes:List<RecipeItem> = Gson().fromJson(json, listType)
                    callback(recipes)
                }
            }
        })
    }

    private fun createTextView(str: String, tag: String): TextView {
        val textView = TextView(this)
        textView.textSize = 25f
        textView.text = str
        textView.tag = tag

        return textView
    }
}