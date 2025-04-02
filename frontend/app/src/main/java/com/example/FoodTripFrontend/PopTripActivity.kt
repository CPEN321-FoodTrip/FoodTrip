package com.example.FoodTripFrontend

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import com.example.FoodTripFrontend.recyclerViewHelper.itemClass.RecipeItem
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okio.IOException
import java.util.ArrayList

/**
 * Activity showing details of selected trip from PastTripActivity
 */
class PopTripActivity : Activity() {

    /**
     * Companion object for PopTripActivity.
     * Stores static constants related to the activity.
     */
    companion object {
        private const val TAG = "PastTripActivity"
    }

    /**
     * class of sub-element in class Stop
     *
     * @property name: city name of the stop
     * @property latitude: latitude coordinate of the city
     * @property longitude: longitude coordinate of the city
     * @property population: population of the city
     */
    data class StopLocation(
        val name: String,
        val latitude: String,
        val longitude: String,
        val population: String
    )

    /**
     * class of sub-element in class Route
     *
     * @property location: location of the stop
     * @property distanceFromStart: straight distance from the starting point
     * @property cumulativeDistance: total distance from the starting point
     * @property segmentPercentage: progress percentage of the current stop in the trip
     *                              from the starting point
     */
    data class Stop(
        val location: StopLocation,
        val distanceFromStart: Float,
        val cumulativeDistance: Float,
        val segmentPercentage: Float
    )

    /**
     * JSON format for API response in getTrip()
     *
     * @property _id: unique ID of the trip
     * @property userID: unique ID of the user create the trip
     * @property start_location: starting location of the trip
     * @property end_location: destination of the trip
     * @property stops: list of intermediate stops
     */
    data class Route(
        val _id: String,
        val userID: String,
        val start_location: PastTripActivity.LocationItem,
        val end_location: PastTripActivity.LocationItem,
        val stops: List<Stop>
    )

    /**
     * class of sub-element in class EdamamResponse
     *
     * @property recipeName: name of the recipe
     * @property recipeID: unique identifier of the recipe
     * @property url: link to the recipe
     * @property ingredients: list of ingredients needed for the recipe
     */
//    data class Recipe(
//        val recipeName: String,
//        val recipeID: String,
//        val url: String,
//        val ingredients: List<String>,
//    )

    /**
     * JSON format for API response in getRecipes()
     *
     * @property hits: list of recipes
     */
//    data class EdamamResponse (
//        val hits: List<Recipe>
//    )

    lateinit var client: OkHttpClient
    lateinit var stopList: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pop_trip)

        val windowMetrics = windowManager.currentWindowMetrics
        val bounds = windowMetrics.bounds
        val width = bounds.width()
        val height = bounds.height()

        window.setLayout((width*.8).toInt(), (height*.7).toInt())

        client = OkHttpClient()
        stopList = findViewById<LinearLayout>(R.id.trip_list_layout)

        val tripID = intent.getStringExtra("tripID")
        Log.d(TAG, "$tripID is passed into here")
        if (tripID != null) {

            getTrip(tripID) {route ->
                processTrip(route, tripID)
                getRecipes(tripID) {recipes -> processRecipes(recipes)}
            }

        }
    }

    private fun getTrip(tripID : String, callback: (Route) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}routes/$tripID"
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
                    val listType = object : TypeToken<Route>() {}.type
                    var route:Route = Gson().fromJson(json, listType)
                    callback(route)
                }
            }
        })
    }

    private fun processTrip(route: Route, tripID: String) {
        runOnUiThread {
            showTrip(route, tripID)
        }
    }

    private fun showTrip(route: Route, tripID: String) {
        stopList.removeAllViews()

        val startItemView = TextView(this)
        startItemView.textSize = 25f
        startItemView.text = "${route.start_location.name}"
        stopList.addView(startItemView)

        val stops = route.stops
        for (i in 0..<stops.count()) {
            val itemView = TextView(this)

            val stop = stops[i]
            itemView.textSize = 25f
            itemView.text = "-> ${stop.location.name}"

            stopList.addView(itemView)
        }

        val endItemView = TextView(this)
        endItemView.textSize = 25f
        endItemView.text = "-> ${route.end_location.name}"
        stopList.addView(endItemView)

        val showRouteButton = findViewById<Button>(R.id.show_past_route_button)
        showRouteButton.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            intent.putExtra("tripId", tripID)
            startActivity(intent)
        }
    }

    private fun getRecipes(tripID: String, callback: (List<RecipeItem>) -> Unit) {
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
                    if (!response.isSuccessful) throw IOException("Unexpected code $response")

                    val json = response.body!!.string()
                    val listType = object : TypeToken<List<RecipeItem>>() {}.type
                    var recipes:List<RecipeItem> = Gson().fromJson(json, listType)
                    callback(recipes)
                }
            }
        })
    }

    private fun processRecipes(recipes: List<RecipeItem>) {
        Log.d(TAG, "processing response")
        runOnUiThread {
            showRecipes(recipes)
        }
    }

    private fun showRecipes(recipes: List<RecipeItem>) {
        val stopsCount = stopList.getChildCount() - 2
        val recipesCount = recipes.count()

        for (i in 0..<recipesCount) {
            val recipe = recipes[i]

            val index = 1 + i * 2
            val itemView = TextView(this)

            // val recipe = recipes[i]
            itemView.textSize = 25f
            itemView.setPadding(30, 0, 0, 0)
            itemView.text = "recipe ${i+1}: ${recipe.recipeName}"
            itemView.tag = "recipe ${i+1}"

            itemView.setOnClickListener {
                Log.d(TAG, "${itemView.text} is clicked")

                val ingredients = ArrayList<String>()
                for (ingredient in recipe.ingredients) {
                    ingredients.add(ingredient.text)
                }

                var _url = recipe.url
                if (_url?.startsWith("http://") == true) {
                    _url = _url.replaceFirst("http://", "https://")
                }

//                val sample_ingredients = ArrayList<String>()
//                sample_ingredients.add("ingred 1")
//                sample_ingredients.add("ingred 2")
//                sample_ingredients.add("ingred 3")

                val intent = Intent(this, PopRecipeActivity::class.java)
                intent.putExtra("recipeName", recipe.recipeName)
                intent.putExtra("url", _url)
                intent.putStringArrayListExtra("ingredients", ingredients)
                startActivity(intent)
            }

            stopList.addView(itemView, index)
        }
    }
}