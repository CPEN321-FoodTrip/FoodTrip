package com.example.FoodTripFrontend

import android.app.Activity
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
import com.example.FoodTripFrontend.GroceryStoreActivity.DiscountItem
import com.example.FoodTripFrontend.PastTripActivity.Companion
import com.example.FoodTripFrontend.PastTripActivity.TripItem
import com.google.android.gms.maps.model.LatLng
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okio.IOException
import java.util.ArrayList

class PopTripActivity : Activity() {

    companion object {
        private const val TAG = "PastTripActivity"
    }

    data class StopLocation(
        val name: String,
        val latitude: String,
        val longitude: String,
        val population: String
    )

    data class Stop(
        val location: StopLocation,
        val distanceFromStart: Float,
        val cumulativeDistance: Float,
        val segmentPercentage: Float
    )

    data class Route(
        val _id: String,
        val userID: String,
        val start_location: PastTripActivity.LocationItem,
        val end_location: PastTripActivity.LocationItem,
        val stops: List<Stop>
    )

    data class Recipe(
        val recipeName: String,
        val recipeID: String,
        val url: String,
        val ingredients: List<String>,
    )

    data class EdamamResponse (
        val hits: List<Recipe>
    )

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

        // TODO: change processRecipes -> getRecipes
        val tripID = intent.getStringExtra("tripID")
        Log.d(TAG, "$tripID is passed into here")
        if (tripID != null) {
            getTrip(tripID) {route ->
                processTrip(route)
                // getRecipe(tripID) {recipes -> processRecipes(recipes)}
                processRecipes(EdamamResponse(emptyList()))
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

    private fun processTrip(route: Route) {
        runOnUiThread {
            showTrip(route)
        }
    }

    private fun showTrip(route: Route) {
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
            val coordsList = mutableListOf<LatLng>()
            val nameList = mutableListOf<String>()

            // add start location
            coordsList.add(LatLng(route.start_location.latitude.toDouble()
                , route.start_location.longitude.toDouble()))
            nameList.add(route.start_location.name)

            // add stops
            for (i in 0..<stops.count()) {
                val stop = stops[i]

                coordsList.add(LatLng(stop.location.latitude.toDouble(),
                    stop.location.longitude.toDouble()))
                nameList.add(stop.location.name)

                Log.d(TAG, "Stop $i: ${stop.location.latitude}, ${stop.location.longitude}")
            }

            // add end location
            coordsList.add(LatLng(route.end_location.latitude.toDouble()
                , route.end_location.longitude.toDouble()))
            nameList.add(route.end_location.name)

            val intent = Intent(this, MainActivity::class.java)
            val bundle = Bundle()
            bundle.putParcelableArrayList("coordinates", ArrayList(coordsList))
            bundle.putStringArrayList("cities", ArrayList(nameList))
            intent.putExtras(bundle)
            startActivity(intent)
        }
    }

    // TODO: fix the url
    // TODO: fix the data structure for reading JSON of EdamameResponse
    private fun getRecipes(tripID: String, callback: (EdamamResponse) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}get-recipe-from-route?tripID=$tripID"
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
                    var recipes:EdamamResponse = Gson().fromJson(json, listType)
                    callback(recipes)
                }
            }
        })
    }

    private fun processRecipes(recipes: EdamamResponse) {
        runOnUiThread {
            showRecipes(recipes)
        }
    }

    private fun showRecipes(response: EdamamResponse) {
        val stopsCount = stopList.getChildCount() - 2
        val recipesCount = response.hits.count()

        val recipes = response.hits

        // TODO: change stopsCount to recipesCount
        // TODO: change the itemView.text
        for (i in 0..<stopsCount) {
            val index = 2 + i * 2
            val itemView = TextView(this)

            // val recipe = recipes[i]
            itemView.textSize = 25f
            itemView.text = "    recipe ${i+1}: something"
            itemView.tag = "recipe ${i+1}"

            // TODO: implement parameters to PopRecipeActivity
            itemView.setOnClickListener {
                Log.d(TAG, "${itemView.text} is clicked")

                val sample_ingredients = ArrayList<String>()
                sample_ingredients.add("ingred 1")
                sample_ingredients.add("ingred 2")
                sample_ingredients.add("ingred 3")

                val intent = Intent(this, PopRecipeActivity::class.java)
                intent.putExtra("recipeName", "recipe ${i+1}")
                intent.putExtra("url", "https://www.edamam.com/results/recipe/?recipe=chicken-fried-steak-aa9d77c1664fe1b79ac35ea8228a48e8/search=steak")
                intent.putStringArrayListExtra("ingredients", sample_ingredients)
                startActivity(intent)
            }

            stopList.addView(itemView, index)
        }
    }
}