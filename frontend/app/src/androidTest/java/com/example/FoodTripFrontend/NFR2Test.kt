package com.example.FoodTripFrontend

import android.content.Context
import android.util.Log
import android.view.View
import androidx.test.core.app.ApplicationProvider
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.closeSoftKeyboard
import androidx.test.espresso.action.ViewActions.typeText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.intent.matcher.IntentMatchers.hasComponent
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.hamcrest.Matcher
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestName
import org.junit.runner.RunWith

val startCount = 0
val maxCount = 3
var clickCount = 0

/**
 * customize click action with click count
 * for usability test: click count <= 3 for each use case
 */
fun customClick(): ViewAction {
    return object : ViewAction {
        override fun getConstraints(): Matcher<View> {
            return ViewMatchers.isClickable()
        }

        override fun getDescription(): String {
            return "custom click action"
        }

        override fun perform(uiController: UiController, view: View) {
            clickCount++
            click().perform(uiController, view)
        }
    }
}

/**
 * Print test log result of usability test
 */
fun checkClick(str: String) {
    try {
        assert(clickCount <= maxCount)
        Log.d(TAG, "Usability Test Passed($clickCount clicks): $str")
    } catch (e: AssertionError) {
        Log.d(TAG, "Usability Test Failed($clickCount clicks): $str")
    }
}

@RunWith(AndroidJUnit4::class)
class UsabilityTest_ManageDiscounts {
    val sampleIngredient = "snack"
    val samplePrice = "10"
    val sample = "snack: $10"

    /**
     * Initialization for intent checking
     *
     * Needed for switching activities
     */
    @Before
    fun setup() {
        clickCount = startCount
        Intents.init()

        val context = ApplicationProvider.getApplicationContext<Context>()
        var sharedPreferences = context.getSharedPreferences("UserData", Context.MODE_PRIVATE);
        sharedPreferences.edit().putString("userEmail", "test_email").apply()
        sharedPreferences.edit().putString("userName", "test_store").apply()
    }

    /**
     * Cleanup for intent checking
     *
     * Needed for switching activities
     */
    @After
    fun tearDown() {
        Intents.release()
        checkClick("${this::class.simpleName}:${TestName().methodName}")
    }

    @get:Rule
    val activityRule = ActivityScenarioRule(GroceryStoreActivity::class.java)

    @Test fun PostDiscountsTest() {
        onView(withId(R.id.ingredient_input)).perform(typeText(sampleIngredient), closeSoftKeyboard())
        onView(withId(R.id.price_input)).perform(typeText(samplePrice), closeSoftKeyboard())
        clickCount++

        onView(withId(R.id.post_button_grocery_store)).perform(customClick())
        Thread.sleep(3000)
    }

    @Test fun DeleteDiscountTest() {
        onView(withText(sample))
            .check(matches(isDisplayed()))
            .perform(customClick())

        onView(withId(R.id.delete_button_grocery_store)).perform(customClick())
        Thread.sleep(3000)
    }
}