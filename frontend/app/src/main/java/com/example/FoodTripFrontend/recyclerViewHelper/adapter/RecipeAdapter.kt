package com.example.FoodTripFrontend.recyclerViewHelper.adapter

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.text.TextUtils
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.view.isGone
import androidx.core.view.size
import androidx.recyclerview.widget.RecyclerView
import com.example.FoodTripFrontend.BuildConfig
import com.example.FoodTripFrontend.GroceryActivity
import com.example.FoodTripFrontend.GroceryActivity.DiscountItem
import com.example.FoodTripFrontend.GroceryActivity.Ingredient
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
import java.math.BigDecimal
import java.math.RoundingMode

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

        holder.recipeName.text = "Stop ${position+1}: ${recipeItem.recipeName}"

        val ingredients = recipeItem.ingredients
        holder.ingredList.removeViews(0, holder.ingredList.size-1)

        getAllDiscounts() { allDiscounts ->
            for (i in 0..<ingredients.size) {
                val ingredient = ingredients[i]

                // create linear layout
                val linearLayout = LinearLayout(holder.itemView.context)
                linearLayout.orientation = LinearLayout.HORIZONTAL
                linearLayout.layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )

                // create text view
                val ingredTextView = createIngredTextView(holder, ingredient)

                // create image view
                val imageView: ImageView = ImageView(holder.itemView.context)
                imageView.setImageResource(R.drawable.green_circle)
                val imageParams : LinearLayout.LayoutParams = LinearLayout.LayoutParams(20, 20)
                imageView.setLayoutParams(imageParams)

                linearLayout.addView(ingredTextView);
                linearLayout.addView(imageView);

                if (allDiscounts.contains(ingredient.food.lowercase())) {
                    imageView.visibility = View.VISIBLE
                } else {
                    imageView.visibility = View.GONE
                }

                holder.ingredList.addView(linearLayout, i)
            }
        }

        holder.recipeName.setOnClickListener() {
            if (holder.recipeDetail.isGone) {
                holder.recipeName.ellipsize = null
                holder.recipeDetail.visibility = View.VISIBLE
            } else {
                holder.recipeName.ellipsize = TextUtils.TruncateAt.END
                holder.recipeDetail.visibility = View.GONE
            }
        }

        holder.linkToRecipeButton.setOnClickListener() {
            val intent = Intent(holder.itemView.context, PopRecipeActivity::class.java)
            var _url = recipeItem.url
            if (_url?.startsWith("http://") == true) {
                _url = _url.replaceFirst("http://", "https://")
            }
            intent.putExtra("url", _url)
            intent.putExtra("from", "grocery")
            holder.itemView.context.startActivity(intent)
        }

        holder.recipeDetail.visibility = View.GONE
    }

    override fun getItemCount(): Int {
        return recipeList.size
    }

    private fun createIngredTextView(holder: RecipeViewHolder, ingredient: Ingredient) : TextView {
        val ingredTextView = TextView(holder.itemView.context)
        var quantity = BigDecimal(ingredient.quantity.toDouble())
            .setScale(3, RoundingMode.HALF_UP)
            .stripTrailingZeros()
            .toPlainString() + " "
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

        return ingredTextView
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

    private fun getAllDiscounts(callback: (List<String>) -> Unit) {
        val url = "${BuildConfig.SERVER_URL}discounts"

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
                        val allDiscounts: List<String> = emptyList()
                        callback(allDiscounts)

                        return
                    }
                    if (!response.isSuccessful) throw IOException("Unexpected code $response")

                    val json = response.body!!.string()
                    val listType = object : TypeToken<List<DiscountItem>>() {}.type
                    val discounts:List<DiscountItem> = Gson().fromJson(json, listType)
                    val allDiscounts:List<String> = discounts.map { it.ingredient.lowercase() }

                    callback(allDiscounts)
                }
            }
        })
    }

    // ViewHolder class
    class RecipeViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val recipeName: TextView = itemView.findViewById(R.id.recipeName)
        val recipeDetail: ScrollView = itemView.findViewById(R.id.recipeDetail);
        val ingredList: LinearLayout = itemView.findViewById(R.id.ingredList)
        val linkToRecipeButton: Button = itemView.findViewById(R.id.linkToRecipeButton)
    }
}