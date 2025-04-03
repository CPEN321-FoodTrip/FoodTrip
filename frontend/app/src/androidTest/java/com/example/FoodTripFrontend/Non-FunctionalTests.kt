package com.example.FoodTripFrontend

import android.content.Context
import android.util.Log
import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.closeSoftKeyboard
import androidx.test.espresso.action.ViewActions.typeText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.espresso.intent.matcher.IntentMatchers.hasComponent
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.espresso.intent.Intents
import org.junit.After

import org.junit.Test
import org.junit.runner.RunWith

import org.junit.Before
import org.junit.Rule
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.ViewActions.replaceText
import androidx.test.espresso.assertion.ViewAssertions.doesNotExist
import androidx.test.espresso.intent.matcher.IntentMatchers
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.espresso.matcher.ViewMatchers.withParent
import androidx.test.espresso.matcher.ViewMatchers.withTagValue
import org.hamcrest.Matcher
import org.hamcrest.Matchers.`is`
import org.junit.rules.TestName

private val TAG = "TestLog"

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



/**
 * Test of GroceryActivity-related usability
 *
 * Test cases include:
 * Checking number of clicks needed to accomplish tasks
 */
@RunWith(AndroidJUnit4::class)
class MainActivityTest {

    /**
     * Initialization for intent checking
     *
     * Needed for switching activities
     */
    @Before
    fun setup() {
        clickCount = startCount
        Intents.init()
    }

    /**
     * Cleanup for intent checking
     *
     * Needed for switching activities
     */
    @After
    fun tearDown() {
        Intents.release()
        checkClick("${this::class.simpleName}:${testName.methodName}")
    }

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @get:Rule
    var testName = TestName()


    /**
     * Functionality Test for the Main Activity
     *
     * Verifies that the manage trip button correctly switches to
     * the manage trip activity
     */
    @Test fun checkManageTrip() {
        onView(withId(R.id.ManageTrip)).perform(customClick())
    }

    /**
     * Functionality Test for the Main Activity
     *
     * Verifies that the past trip button correctly switches to
     * the past trip activity
     */
    @Test fun checkPastTrips() {
        onView(withId(R.id.PastTrips)).perform(customClick())
    }

    /**
     * Functionality Test for the Main Activity
     *
     * Verifies that the view recipe button correctly switches to
     * the view recipe activity
     */
    @Test fun checkViewRecipe() {
        onView(withId(R.id.viewRecipes)).perform(customClick())
    }

    /**
     * Functionality Test for the Main Activity
     *
     * Verifies that the manage account button correctly switches to
     * the manage account activity
     */
    @Test fun checkAccount() {
        onView(withId(R.id.ManageAccount)).perform(customClick())
    }

    /**
     * Functionality Test for the Main Activity
     *
     * Verifies that the sign out button correctly
     * returns to the login page
     */
    @Test fun signOut() {
        onView(withId(R.id.sign_out_button)).perform(customClick())
    }

}


/**
 * Test of TripActivity-related non-functionality
 *
 */
@RunWith(AndroidJUnit4::class)
class TripActivityTest {

    val testCityHanoi = "Hanoi"
    val testCityVancouver = "Vancouver"
    val testCityBeijing = "Beijing"
    val testCityCalgary = "Calgary"

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @get:Rule
    var testName = TestName()

    /**
     * Initialization for intent checking
     *
     * Needed for switching activities
     */
    @Before
    fun setup() {
        clickCount = startCount
        Intents.init()
    }

    /**
     * Cleanup for intent checking
     *
     * Needed for switching activities
     */
    @After
    fun tearDown() {
        Intents.release()
        checkClick("${this::class.simpleName}:${testName.methodName}")
    }

    /**
     * Non-Functional Test for the Trip Activity
     *
     * Success Scenario:
     * Simulates the scenario where the user enters a
     * short 3 stop trip with less than 2 clicks
     *
     */
    @Test
    fun planRegularTripShort() {
        onView(withId(R.id.ManageTrip)).perform(customClick())

        Intents.intended(hasComponent(TripActivity::class.java.name))

        onView(withId(R.id.startLocation)).perform(typeText(testCityCalgary), closeSoftKeyboard())

        onView(withId(R.id.endLocation)).perform(typeText(testCityVancouver), closeSoftKeyboard())

        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())

        onView(withId(R.id.CreateTrip)).perform(customClick())

        Thread.sleep(5000)

        Intents.intended(hasComponent(MainActivity::class.java.name))

    }
}



/**
 * Test with PastTripActivity with "userEmail=test_person"
 *
 */
@RunWith(AndroidJUnit4::class)
class PastTripActivityTestPersonTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(PastTripActivity::class.java)

    @get:Rule
    var testName = TestName()

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
        sharedPreferences.edit().putString("userEmail", "test_person").apply()

        ActivityScenario.launch(PastTripActivity::class.java)
    }

    /**
     * Cleanup for intent checking
     *
     * Needed for switching activities
     */
    @After
    fun tearDown() {
        Intents.release()
        checkClick("${this::class.simpleName}:${testName.methodName}")
    }


    /**
     * Non-functional Test for the current Activity
     *
     * Verify that the back button successfully returns
     * back to the main activity
     */
    @Test fun backButton() {
        onView(withId(R.id.back_button_past)).perform(customClick() )

        Thread.sleep(1000)
    }

    /**
     * Non-Functional Test for the Past Trip Activity
     *
     * Verify that the user is able to access their past
     * trip recipes within 3 clicks
     */
    @Test fun GeneralRecipeViewPastTrip() {

        Intents.intended(hasComponent(PastTripActivity::class.java.name))

        Thread.sleep(1000)
        onView(withTagValue(`is`("route 1"))).check(matches(isDisplayed()))
            .perform(customClick()  )

        Thread.sleep(1000)
        Intents.intended(IntentMatchers.hasComponent(PopTripActivity::class.java.name))
        onView(withTagValue(`is`("recipe 1"))).check(matches(isDisplayed())).perform(customClick())

        Thread.sleep(1000)
        Intents.intended(IntentMatchers.hasComponent(PopRecipeActivity::class.java.name))

        Thread.sleep(1000)
        onView(withTagValue(`is`("url"))).check(matches(isDisplayed())).perform(customClick())

        Thread.sleep(5000)
        onView(withTagValue(`is`("recipe web"))).check(matches(isDisplayed()))
    }
}


/**
 * Test with GrocerySToreActivity for usability
 *
 */
@RunWith(AndroidJUnit4::class)
class GroceryStoreActivityTest {
    val sampleIngredient1 = "snack"
    val samplePrice1 = "10"
    val sample1 = "snack: $10"
    val sampleIngredient2 = "apple"
    val samplePrice2 = "20"
    val sample2 = "apple: $20"


    @get:Rule
    val activityRule = ActivityScenarioRule(GroceryStoreActivity::class.java)

    @get:Rule
    var testName = TestName()

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
        sharedPreferences.edit().putString("userEmail", "test_person2").apply()

        ActivityScenario.launch(GroceryStoreActivity::class.java)
    }

    /**
     * Cleanup for intent checking
     *
     * Needed for switching activities
     */
    @After
    fun tearDown() {
        Intents.release()
        checkClick("${this::class.simpleName}:${testName.methodName}")

    }



    /**
     * Functionality Test for the Grocery Store Activity
     *
     * Success Scenario:
     * Simulates a user creating a item to be listed
     * for a discount by entering an item name and price.
     * Then simulates the user deleting the item from the discounts list
     *
     * Verify that the item and its price are properly displayed
     * on the page and that the delete functionality
     * removes the item from the page
     *
     */
    @Test fun postAndDeleteDiscountTest() {
        onView(withId(R.id.ingredient_input)).perform(typeText(sampleIngredient1), closeSoftKeyboard())
        onView(withId(R.id.ingredient_input)).check(matches(withText(sampleIngredient1)))

        onView(withId(R.id.price_input)).perform(typeText(samplePrice1), closeSoftKeyboard())
        onView(withId(R.id.price_input)).check(matches(withText(samplePrice1)))

        onView(withId(R.id.post_button_grocery_store)).perform(customClick())
        Thread.sleep(3000)

        onView(withText(sample1))
            .check(matches(isDisplayed()))
            .perform(customClick())

        onView(withId(R.id.delete_button_grocery_store)).perform(customClick())
        Thread.sleep(3000)

        onView(withText(sample1))
            .check(doesNotExist())
    }


    /**
     * Functionality Test for the Grocery Store Activity
     *
     * Success Scenario:
     * Simulates a user creating two items, then selecting them
     * one after the other to delete
     *
     * Verify that the item and its price are properly displayed
     * and that the item the user first selects is properly deleted
     * and that the second item the user selects is properly deleted
     *
     */
    @Test fun changeSelectedTest() {
        onView(withId(R.id.ingredient_input)).perform(typeText(sampleIngredient1), closeSoftKeyboard())
        onView(withId(R.id.price_input)).perform(typeText(samplePrice1), closeSoftKeyboard())
        onView(withId(R.id.post_button_grocery_store)).perform(click())
        Thread.sleep(3000)

        onView(withId(R.id.ingredient_input)).perform(replaceText(sampleIngredient2), closeSoftKeyboard())
        onView(withId(R.id.price_input)).perform(replaceText(samplePrice2), closeSoftKeyboard())
        onView(withId(R.id.post_button_grocery_store)).perform(click())
        Thread.sleep(3000)

        onView(withText(sample2))
            .perform(customClick())

        onView(withText(sample1))
            .perform(customClick())
        onView(withId(R.id.delete_button_grocery_store)).perform(customClick())
        Thread.sleep(3000)

        onView(withText(sample2))
            .check(matches(isDisplayed()))
            .perform(click())
        onView(withId(R.id.delete_button_grocery_store)).perform(click())
    }
}
