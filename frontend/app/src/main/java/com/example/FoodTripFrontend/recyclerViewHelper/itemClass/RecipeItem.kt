package com.example.FoodTripFrontend.recyclerViewHelper.itemClass

import com.example.FoodTripFrontend.GroceryActivity.Ingredient

class RecipeItem(recipeName: String, recipeID: String, url: String, ingredients: List<Ingredient>) {
    var recipeName: String? = recipeName
    var recipeID: String? = recipeID
    var url: String ? = url
    var ingredients: List<Ingredient> = emptyList()

    init {
        if (ingredients.isNotEmpty()) {
            this.ingredients = ingredients
        }
    }
}