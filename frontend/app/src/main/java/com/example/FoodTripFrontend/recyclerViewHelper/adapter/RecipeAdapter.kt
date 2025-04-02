package com.example.FoodTripFrontend.recyclerViewHelper.adapter

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.view.isGone
import androidx.recyclerview.widget.RecyclerView
import androidx.test.internal.runner.junit4.statement.UiThreadStatement.runOnUiThread
import com.example.FoodTripFrontend.BuildConfig
import com.example.FoodTripFrontend.GroceryActivity
import com.example.FoodTripFrontend.GroceryActivity.DiscountItem
import com.example.FoodTripFrontend.PopActivity
import com.example.FoodTripFrontend.PopRecipeActivity
import com.example.FoodTripFrontend.R
import com.example.FoodTripFrontend.recyclerViewHelper.itemClass.RecipeItem
import com.google.android.material.snackbar.Snackbar
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okio.IOException
import kotlin.reflect.KFunction2

class RecipeAdapter(private val recipeList: List<RecipeItem>) :
    RecyclerView.Adapter<RecipeAdapter.RecipeViewHolder>() {
    lateinit var client: OkHttpClient

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecipeViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.recipe_card, parent, false)
        client = OkHttpClient()

        return RecipeViewHolder(view)
    }

    override fun onBindViewHolder(holder: RecipeViewHolder, position: Int) {
        val recipeItem = recipeList[position]

        holder.recipeName.text = "Day ${position+1}: ${recipeItem.recipeName}"

        val ingredients = recipeItem.ingredients
        for (i in 0..<ingredients.size) {
            val ingredient = ingredients[i]

            val ingredTextView = TextView(holder.itemView.context)
            var quantity = ingredient.quantity.toString() + " "
            var measure = ingredient.measure + " "
            var food = ingredient.food

            if (quantity == "0 ") quantity = ""
            if (measure == "<unit> " || measure == "null ") measure = ""

            ingredTextView.text = "$quantity$measure$food"

            ingredTextView.setOnClickListener() {
                getDiscount(ingredient.food) { discounts ->
                    processDiscount(discounts, holder)
                }
            }

            holder.ingredList.addView(ingredTextView, i)
        }

        holder.recipeName.setOnClickListener() {
            if (holder.recipeDetail.isGone) {
                holder.recipeDetail.visibility = View.VISIBLE
            } else {
                holder.recipeDetail.visibility = View.GONE
            }
        }

        holder.linkToRecipeButton.setOnClickListener() {
            val intent = Intent(holder.itemView.context, PopRecipeActivity::class.java)
            intent.putExtra("url", recipeItem.url)
            intent.putExtra("from", "grocery")
            holder.itemView.context.startActivity(intent)
        }

        holder.recipeDetail.visibility = View.GONE
    }

    override fun getItemCount(): Int {
        return recipeList.size
    }

    private fun getDiscount(ingredient : String, callback: (List<DiscountItem>) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}discounts?ingredient=${ingredient}"

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

    private fun processDiscount(discounts: List<DiscountItem>, holder: RecipeViewHolder) {
        if (discounts.isEmpty()) {
            Handler(Looper.getMainLooper()).post {
                Snackbar.make(
                    holder.itemView,
                    "No discount available",
                    Snackbar.LENGTH_SHORT
                ).show()
            }
        } else {
            showDiscount(discounts, holder.itemView.context)
        }
    }

    private fun showDiscount(discounts: List<DiscountItem>, context: Context) {
        val names = arrayListOf<String>()
        val prices = arrayListOf<Int>()

        for (discount in discounts) {
            names.add(discount.storeName)
            prices.add(discount.price)
        }
        val intent = Intent(context, PopActivity::class.java)
        intent.putStringArrayListExtra("names", names)
        intent.putIntegerArrayListExtra("prices", prices)
        context.startActivity(intent)
    }

    // ViewHolder class
    class RecipeViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val recipeName: TextView = itemView.findViewById(R.id.recipeName)
        val recipeDetail: ScrollView = itemView.findViewById(R.id.recipeDetail);
        val ingredList: LinearLayout = itemView.findViewById(R.id.ingredList)
        val linkToRecipeButton: Button = itemView.findViewById(R.id.linkToRecipeButton)
    }
}