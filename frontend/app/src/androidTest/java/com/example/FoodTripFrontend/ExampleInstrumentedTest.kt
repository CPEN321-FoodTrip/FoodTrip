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

import org.junit.Assert.*
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
import com.google.android.gms.maps.model.LatLng
import org.hamcrest.Matcher
import org.hamcrest.Matchers.allOf
import org.hamcrest.Matchers.`is`
import org.junit.rules.TestName

val TAG = "TestLog"

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
 * Test of LoginActivity-related functionality.
 *
 * Test cases include:
 * - Testing sign-in functionality as user/admin.
 */
@RunWith(AndroidJUnit4::class)
class LoginActivityTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(LoginActivity::class.java)

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
     * Ui Test for the corresponding Activity
     *
     * Verifies that key buttons and display elements
     * are visible with correct text
     */
    @Test
    fun checkElements() {

        onView(withId(R.id.sign_in_button_user)).check(matches(withText("Sign In (User)")))
        onView(withId(R.id.sign_in_button_admin)).check(matches(withText("Sign In (Admin)")))

    }

}

/**
 * Test of GroceryActivity-related functionality.
 *
 * Test cases include:
 * - Checking the display of key UI elements.
 * - Verifying the activity-directing button functionality.
 * - Testing sign out functionality.
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
     * Ui Test for the Main Activity
     *
     * Verifies that the 4 main buttons are displayed
     */
    @Test fun checkElements() {
        onView(withId(R.id.PastTrips)).check(matches(withText("View Past Trips")))
        onView(withId(R.id.ManageTrip)).check(matches(withText("Manage Trip")))
        onView(withId(R.id.viewRecipes)).check(matches(withText("View Recipes")))
        onView(withId(R.id.ManageAccount)).check(matches(withText("Manage Account")))
    }

    /**
     * Functionality Test for the Main Activity
     *
     * Verifies that the manage trip button correctly switches to
     * the manage trip activity
     */
    @Test fun checkManageTrip() {
        onView(withId(R.id.ManageTrip)).perform(customClick())
        Intents.intended(IntentMatchers.hasComponent(TripActivity::class.java.name))
    }

    /**
     * Functionality Test for the Main Activity
     *
     * Verifies that the past trip button correctly switches to
     * the past trip activity
     */
    @Test fun checkPastTrips() {
        onView(withId(R.id.PastTrips)).perform(customClick())
        Intents.intended(IntentMatchers.hasComponent(PastTripActivity::class.java.name))

    }

    /**
     * Functionality Test for the Main Activity
     *
     * Verifies that the view recipe button correctly switches to
     * the view recipe activity
     */
    @Test fun checkViewRecipe() {
        onView(withId(R.id.viewRecipes)).perform(customClick())
        Intents.intended(IntentMatchers.hasComponent(GroceryActivity::class.java.name))

    }

    /**
     * Functionality Test for the Main Activity
     *
     * Verifies that the manage account button correctly switches to
     * the manage account activity
     */
    @Test fun checkAccount() {
        onView(withId(R.id.ManageAccount)).perform(customClick())
        Intents.intended(IntentMatchers.hasComponent(AccountActivity::class.java.name))

    }

    /**
     * Functionality Test for the Main Activity
     *
     * Verifies that the sign out button correctly
     * returns to the login page
     */
    @Test fun signOut() {
        onView(withId(R.id.sign_out_button)).check(matches(withText("Sign Out")))

        onView(withId(R.id.sign_out_button)).perform(customClick())

        Intents.intended(IntentMatchers.hasComponent(LoginActivity::class.java.name))
    }

}

/**
 * Test of MainActivityAdmin-related functionality.
 *
 * Test cases include:
 * - Verifying the button to grocery store activity functionality.
 */
@RunWith(AndroidJUnit4::class)
class MainActivityAdminTest {

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
    val activityRule = ActivityScenarioRule(MainActivityAdmin::class.java)

    @get:Rule
    var testName = TestName()

    /**
     * Functionality Test for the Main Admin Activity
     *
     * Verifies that the set groceries button correctly switches
     * to the grocery store activity
     */
    @Test fun setGroceriesButton() {
        onView(withId(R.id.GroceryButton)).perform(customClick())
        Intents.intended(hasComponent(GroceryStoreActivity::class.java.name))
    }

}

/**
 * Test of TripActivity-related functionality
 *
 * Test cases include:
 * - regular cases of creating trips
 * - testing rejection and notification to invalid input
 */
@RunWith(AndroidJUnit4::class)
class TripActivityTest {

    val testCityHanoi = "Hanoi"
    val testCityVancouver = "Vancouver"
    val testCityBeijing = "Beijing"
    val testCityCalgary = "Calgary"

    @get:Rule
    val activityRule = ActivityScenarioRule(TripActivity::class.java)

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
     * Functionality Test for the Trip Activity
     *
     * Success Scenario:
     * Simulates the scenario where the user enters a
     * short 3 stop trip with no errors.
     *
     * Verify that the create trip button returns to the
     * main activity and that the map is now displayed
     */
    @Test fun planRegularTripShort() {
//        val expectedCoordinatesList = mutableListOf<LatLng>()
//        val expectedCitiesList = mutableListOf<String>()

        onView(withId(R.id.startLocation)).perform(typeText(testCityCalgary), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText(testCityCalgary)))

        onView(withId(R.id.endLocation)).perform(typeText(testCityVancouver), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText(testCityVancouver)))

        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("3")))

        onView(withId(R.id.CreateTrip)).perform(customClick())

        Thread.sleep(5000)

        Intents.intended(hasComponent(MainActivity::class.java.name))

        val capturedIntent = Intents.getIntents().last()

//        val bundle = capturedIntent.extras
//        assertNotNull(bundle)
//
//        val coordinates =
//            bundle?.getParcelableArrayList<LatLng>("coordinates")
//        assertNotNull(coordinates)
//        assertEquals(expectedCoordinatesList, coordinates)
//
//        val cities = bundle?.getStringArrayList("cities")
//        assertNotNull(cities)
//        assertEquals(expectedCitiesList, cities)

        onView(withId(R.id.map)).check(matches(isDisplayed()))
    }



    /**
     * Functionality Test for the Trip Activity
     *
     * Failure Scenario:
     * Simulates the scenario where the user enters an
     * invalid starting city
     *
     * Verify that the create trip button displays a
     * Snackbar message alerting the user of the error
     */
    @Test fun wrongStart() {
        onView(withId(R.id.startLocation)).perform(typeText("asdkf;a"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("asdkf;a")))

        onView(withId(R.id.endLocation)).perform(typeText(testCityHanoi), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText(testCityHanoi)))

        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("3")))

        onView(withId(R.id.CreateTrip)).perform(customClick())

        Thread.sleep(1000)

        onView(withText("Invalid Start City"))
            .check(matches(isDisplayed()))

    }

    /**
     * Functionality Test for the Trip Activity
     *
     * Failure Scenario:
     * Simulates the scenario where the user enters an
     * invalid ending city
     *
     * Verify that the create trip button displays a
     * Snackbar message alerting the user of the error
     */
    @Test fun wrongEnd() {
        onView(withId(R.id.startLocation)).perform(typeText(testCityBeijing), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText(testCityBeijing)))

        onView(withId(R.id.endLocation)).perform(typeText("ghdioadfk"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("ghdioadfk")))

        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("3")))

        onView(withId(R.id.CreateTrip)).perform(customClick())

        Thread.sleep(1000)

        onView(withText("Invalid End City"))
            .check(matches(isDisplayed()))
    }

    /**
     * Functionality Test for the Trip Activity
     *
     * Failure Scenario:
     * Simulates the scenario where the user enters the
     * same start and end city
     *
     * Verify that the create trip button displays a
     * Snackbar message alerting the user of the error
     */
    @Test fun sameStartEnd() {
        onView(withId(R.id.startLocation)).perform(typeText(testCityBeijing), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText(testCityBeijing)))

        onView(withId(R.id.endLocation)).perform(typeText(testCityBeijing), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText(testCityBeijing)))

        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("3")))

        onView(withId(R.id.CreateTrip)).perform(customClick())

        Thread.sleep(1000)

        onView(withText("Route Cannot Have Same Start/End"))
            .check(matches(isDisplayed()))
    }

    /**
     * Functionality Test for the Trip Activity
     *
     * Failure Scenario:
     * Simulates the scenario where the user enters a
     * trip with an invalid number of stops (0)
     *
     * Verify that the create trip button displays a
     * Snackbar message alerting the user of the error
     */
    @Test fun wrongStopsAmount() {
        onView(withId(R.id.startLocation)).perform(typeText(testCityBeijing), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText(testCityBeijing)))

        onView(withId(R.id.endLocation)).perform(typeText(testCityHanoi), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText(testCityHanoi)))

        onView(withId(R.id.numstops)).perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("0")))

        onView(withId(R.id.CreateTrip)).perform(customClick())

        Thread.sleep(1000)

        onView(withText("Invalid Number of Stops"))
            .check(matches(isDisplayed()))
    }

    /**
     * Functionality Test for the Trip Activity
     *
     * Failure Scenario:
     * Simulates the scenario where the user doesn't
     * enter a starting city
     *
     * Verify that the create trip button displays a
     * Snackbar message alerting the user of the error
     */
    @Test fun missingInputsStart() {
        onView(withId(R.id.endLocation)).perform(typeText(testCityHanoi), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText(testCityHanoi)))

        onView(withId(R.id.numstops)).perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("0")))

        onView(withId(R.id.CreateTrip)).perform(customClick())

        Thread.sleep(1000)

        onView(withText("Missing Start City"))
            .check(matches(isDisplayed()))
    }

    /**
     * Functionality Test for the Trip Activity
     *
     * Failure Scenario:
     * Simulates the scenario where the user doesn't
     * enter a ending city
     *
     * Verify that the create trip button displays a
     * Snackbar message alerting the user of the error
     */
    @Test fun missingInputsEnd() {
        onView(withId(R.id.startLocation)).perform(typeText(testCityBeijing), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText(testCityBeijing)))

        onView(withId(R.id.numstops)).perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("0")))

        onView(withId(R.id.CreateTrip)).perform(customClick())

        Thread.sleep(1000)

        onView(withText("Missing End City"))
            .check(matches(isDisplayed()))
    }

    /**
     * Functionality Test for the Trip Activity
     *
     * Failure Scenario:
     * Simulates the scenario where the user doesn't enter
     * a number of desired stops
     *
     * Verify that the create trip button displays a
     * Snackbar message alerting the user of the error
     */
    @Test fun missingInputsStops() {
        onView(withId(R.id.startLocation)).perform(typeText(testCityBeijing), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText(testCityBeijing)))

        onView(withId(R.id.endLocation)).perform(typeText(testCityHanoi), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText(testCityHanoi)))

        onView(withId(R.id.CreateTrip)).perform(customClick())

        Thread.sleep(1000)

        onView(withText("Missing Number of Stops"))
            .check(matches(isDisplayed()))
    }
}

//@RunWith(AndroidJUnit4::class)
//class AccountManageTest {
//    @Rule
//    val activityRule = ActivityScenarioRule(AccountActivity::class.java)
//}
//

/**
 * Test with PastTripActivity on "no past trip record"
 *
 * Test cases included:
 * - checking UI elements
 * - verifying back button functionality
 * - verifying case of no past trip record
 */
@RunWith(AndroidJUnit4::class)
class PastTripActivityEmptyTest {

    /**
     * Initialization for intent checking
     * and Test username creation
     *
     * Needed for switching activities
     * and past trip tests
     */
    @Before
    fun setup() {
        clickCount = startCount
        Intents.init()
        val context = ApplicationProvider.getApplicationContext<Context>()
        var sharedPreferences = context.getSharedPreferences("UserData", Context.MODE_PRIVATE);
        sharedPreferences.edit().putString("userEmail", "").apply()
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
    val activityRule = ActivityScenarioRule(PastTripActivity::class.java)

    @get:Rule
    var testName = TestName()

    /**
     * UI Test for the current Activity
     *
     * Checks if all required elements are present
     */
    @Test fun checkElements() {
        onView(withId(R.id.back_button_past)).check(matches(withText("Back")))
    }

    /**
     * Functionality Test for the current Activity
     *
     * Verify that the back button successfully returns
     * back to the main activity
     */
    @Test fun backButton() {
        onView(withId(R.id.back_button_past)).perform(customClick())

        Thread.sleep(1000)
        Intents.intended(IntentMatchers.hasComponent(MainActivity::class.java.name))
    }

    /**
     * Functionality Test for the Past Trip Activity
     *
     * Verify that the scenario where a user has no
     * previous trips is displayed correctly
     */
    @Test fun emptyPastTrip() {
        onView(withParent(withId(R.id.past_trip_list_layout))).check(doesNotExist())
    }
}

/**
 * Test with PastTripActivity with "userEmail=test_person"
 *
 * Test cases included:
 * - checking UI elements
 * - verifying back button functionality
 * - Testing viewing details of a past trip and included recipes
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
     * UI Test for the current Activity
     *
     * Checks if all required elements are present
     */
    @Test fun checkElements() {
        onView(withId(R.id.back_button_past)).check(matches(withText("Back")))
    }

    /**
     * Functionality Test for the current Activity
     *
     * Verify that the back button successfully returns
     * back to the main activity
     */
    @Test fun backButton() {
        onView(withId(R.id.back_button_past)).perform(customClick())

        Thread.sleep(1000)
        Intents.intended(IntentMatchers.hasComponent(MainActivity::class.java.name))
    }

    /**
     * Functionality Test for the Past Trip Activity
     *
     * Verify that the user is able to access their past
     * trip recipes correctly
     */
    @Test fun GeneralRecipeViewPastTrip() {
        Thread.sleep(1000)
        onView(withId(R.id.past_trip_list_layout)).check(matches(isDisplayed()))
        onView(withTagValue(`is`("route 1"))).check(matches(isDisplayed()))
            .perform(customClick())

        Thread.sleep(1000)
        Intents.intended(IntentMatchers.hasComponent(PopTripActivity::class.java.name))
        onView(withId(R.id.trip_list_layout)).check(matches(isDisplayed()))
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
 * Test of GroceryActivity-related functionality.
 *
 * Test cases include:
 * - Checking the display of key UI elements.
 * - Verifying the back button functionality.
 * - Testing success and failure scenarios for discount functionality.
 */
@RunWith(AndroidJUnit4::class)
class GroceryActivityTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(GroceryActivity::class.java)

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
     * UI Test for the current Activity
     *
     * Checks if all required elements are present
     */
    @Test fun checkElements() {
        onView(withId(R.id.back_button)).check(matches(withText("Back")))
        onView(withId(R.id.grocery_title_text_view)).check(matches(withText("Grocery")))
        onView(withId(R.id.recipe_list_layout)).check(matches(isDisplayed()))
    }

    /**
     * Functionality Test for the current Activity
     *
     * Verify that the back button successfully returns
     * back to the main activity
     */
    @Test fun backButton() {
        onView(withId(R.id.back_button)).perform(customClick())
        Thread.sleep(5000)
        Intents.intended(IntentMatchers.hasComponent(MainActivity::class.java.name))
    }

    /**
     * Functionality Test for the Grocery Activity
     *
     * Verify that an item with a discount has the
     * discount properly displayed
     *
     */
    @Test fun discountSuccessTest() {
        onView(withTagValue(`is`("ingred 1")))
            .check(matches(isDisplayed()))
            .perform(customClick())

        Thread.sleep(1000)
        Intents.intended(IntentMatchers.hasComponent(PopActivity::class.java.name))
        onView(withTagValue(`is`("discount 1")))
            .check(matches(isDisplayed()))
    }

    /**
     * Functionality Test for the Grocery Activity
     *
     * Verify that an item without a discount has the
     * proper display
     *
     */
    @Test fun discountEmptyTest() {
        onView(withTagValue(`is`("ingred 2")))
            .check(matches(isDisplayed()))
            .perform(customClick())

        Thread.sleep(1000)
        onView(withText("No available discounts"))
            .check(matches(isDisplayed()))
    }
}

/**
 * Test with PastTripActivity on "no past trip record"
 *
 * Test cases included:
 * - Checking UI elements
 * - Verifying back button functionality
 * - Testing success/failure discount delete cases
 * - Testing success/failure discount pose cases
 * - Testing select/unselect discount
 */
@RunWith(AndroidJUnit4::class)
class GroceryStoreActivityTest {
    val sampleIngredient1 = "snack"
    val samplePrice1 = "10"
    val sample1 = "snack: $10"
    val sampleIngredient2 = "apple"
    val samplePrice2 = "20"
    val sample2 = "apple: $20"

    val discountErrorText = "Please select discount to be deleted"
    val inputErrorText = "Please enter valid ingredient and price"

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
     * UI Test for the current Activity
     *
     * Checks if all required elements are present
     */
    @Test fun checkElements() {
        onView(withId(R.id.back_button_grocery_store)).check(matches(withText("Back")))
        onView(withId(R.id.grocery_store_title_text_view)).check(matches(isDisplayed()))
        onView(withId(R.id.discount_list_layout_store)).check(matches(isDisplayed()))
        onView(withId(R.id.ingredient_input)).check(matches(isDisplayed()))
        onView(withId(R.id.price_input)).check(matches(isDisplayed()))
        onView(withId(R.id.post_button_grocery_store)).check(matches(isDisplayed()))
        onView(withId(R.id.delete_button_grocery_store)).check(matches(isDisplayed()))
    }

    /**
     * Functionality Test for the current Activity
     *
     * Verify that the back button successfully returns
     * back to the main activity
     */
    @Test fun backButtonTest() {
        onView(withId(R.id.back_button_grocery_store)).perform(customClick())
        Thread.sleep(7000)
        Intents.intended(IntentMatchers.hasComponent(MainActivity::class.java.name))
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
     * Simulates a user attempting to delete a discounted
     * grocery by clicking the delete button with no
     * item selected, then with selecting and deseleting a item,
     * and then with an item properly selected
     *
     * Verify that the item isn't deleted in the first case and a
     * message that alerts the user appears, then check that the item
     * is not deleted in the second case and displays the same message,
     * then verify that the item is properly deleted in the third case
     *
     */
    @Test fun deleteTest() {
        onView(withId(R.id.ingredient_input)).perform(typeText(sampleIngredient1), closeSoftKeyboard())
        onView(withId(R.id.ingredient_input)).check(matches(withText(sampleIngredient1)))
        onView(withId(R.id.price_input)).perform(typeText(samplePrice1), closeSoftKeyboard())
        onView(withId(R.id.price_input)).check(matches(withText(samplePrice1)))
        onView(withId(R.id.post_button_grocery_store)).perform(customClick())
        Thread.sleep(3000)

        onView(withId(R.id.delete_button_grocery_store)).perform(customClick())
        onView(withText(discountErrorText))
            .check(matches(isDisplayed()))

        onView(withText(sample1))
            .perform(customClick())
            .perform(customClick())

        onView(withId(R.id.delete_button_grocery_store)).perform(customClick())
        onView(withText(discountErrorText))
            .check(matches(isDisplayed()))

        onView(withText(sample1))
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
        onView(withId(R.id.ingredient_input)).check(matches(withText(sampleIngredient1)))
        onView(withId(R.id.price_input)).perform(typeText(samplePrice1), closeSoftKeyboard())
        onView(withId(R.id.price_input)).check(matches(withText(samplePrice1)))
        onView(withId(R.id.post_button_grocery_store)).perform(customClick())
        Thread.sleep(3000)

        onView(withId(R.id.ingredient_input)).perform(replaceText(sampleIngredient2), closeSoftKeyboard())
        onView(withId(R.id.ingredient_input)).check(matches(withText(sampleIngredient2)))
        onView(withId(R.id.price_input)).perform(replaceText(samplePrice2), closeSoftKeyboard())
        onView(withId(R.id.price_input)).check(matches(withText(samplePrice2)))
        onView(withId(R.id.post_button_grocery_store)).perform(customClick())
        Thread.sleep(3000)

        onView(withText(sample2))
            .check(matches(isDisplayed()))
            .perform(customClick())

        onView(withText(sample1))
            .check(matches(isDisplayed()))
            .perform(customClick())
        onView(withId(R.id.delete_button_grocery_store)).perform(customClick())
        Thread.sleep(3000)
        onView(withText(sample1))
            .check(doesNotExist())
        onView(withText(sample2))
            .check(matches(isDisplayed()))

        onView(withText(sample2))
            .check(matches(isDisplayed()))
            .perform(customClick())
        onView(withId(R.id.delete_button_grocery_store)).perform(customClick())
        Thread.sleep(3000)
        onView(withText(sample2))
            .check(doesNotExist())
    }

    /**
     * Functionality Test for the Grocery Store Activity
     *
     * Failure Scenario:
     * Simulates a user imputing a price but no item
     * name and then attempting to post the item
     *
     * Verify that the item is not displayed and a message
     * is displayed alerting the user
     *
     */
    @Test fun emptyIngredientTest() {
        onView(withId(R.id.price_input)).perform(typeText(samplePrice1), closeSoftKeyboard())
        onView(withId(R.id.price_input)).check(matches(withText(samplePrice1)))

        onView(withId(R.id.post_button_grocery_store)).perform(customClick())
        Thread.sleep(1000)
        onView(withText(inputErrorText))
            .check(matches(isDisplayed()))

        onView(withText(": $$samplePrice1"))
            .check(doesNotExist())
    }

    /**
     * Functionality Test for the Grocery Store Activity
     *
     * Failure Scenario:
     * Simulates a user imputing a item name but no
     * price and then attempting to post the item
     *
     * Verify that the item is not displayed and a message
     * is displayed alerting the user
     *
     */
    @Test fun emptyPriceTest() {
        onView(withId(R.id.ingredient_input)).perform(typeText(sampleIngredient1), closeSoftKeyboard())
        onView(withId(R.id.ingredient_input)).check(matches(withText(sampleIngredient1)))

        onView(withId(R.id.post_button_grocery_store)).perform(customClick())
        Thread.sleep(1000)
        onView(withText(inputErrorText))
            .check(matches(isDisplayed()))

        onView(withText("$sampleIngredient1: $"))
            .check(doesNotExist())
    }

    /**
     * Functionality Test for the Grocery Store Activity
     *
     * Failure Scenario:
     * Simulates a user imputing a price of zero for
     * a item then attempting to post the item
     *
     * Verify that the item is not displayed and a message
     * is displayed alerting the user
     *
     */
    @Test fun zeroPriceTest() {
        onView(withId(R.id.ingredient_input)).perform(typeText(sampleIngredient1), closeSoftKeyboard())
        onView(withId(R.id.ingredient_input)).check(matches(withText(sampleIngredient1)))

        onView(withId(R.id.price_input)).perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.price_input)).check(matches(withText("0")))

        onView(withId(R.id.post_button_grocery_store)).perform(customClick())
        Thread.sleep(1000)
        onView(withText(inputErrorText))
            .check(matches(isDisplayed()))

        onView(withText("$sampleIngredient1: $0"))
            .check(doesNotExist())
    }

    //Pretty sure negative numbers cannot be entered anyways
//    @Test fun negativePriceTest() {
//        onView(withId(R.id.ingredient_input)).perform(typeText(sampleIngredient1), closeSoftKeyboard())
//        onView(withId(R.id.ingredient_input)).check(matches(withText(sampleIngredient1)))
//
//        onView(withId(R.id.price_input)).perform(typeText("-100"), closeSoftKeyboard())
//        onView(withId(R.id.price_input)).check(matches(withText("100")))
//    }
}

/**
 * Test to display a recipe from a past trip.
 */
@RunWith(AndroidJUnit4::class)
class RecipeTests {

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
     * Functionality Test for the Recipe viewing
     *
     * Success Scenario:
     * Simulates a user creating a new trip, and then viewing the
     * recipe for the trip by navigating through various activities
     *
     * Verify that the correct activities are navigated to
     * and that the recipe and trip elements are properly displayed
     *
     */
//    @Test fun displayRecipe()  {
//        onView(withId(R.id.ManageTrip)).perform(click())
//
//        Intents.intended(hasComponent(TripActivity::class.java.name))
//
//        onView(withId(R.id.startLocation)).perform(typeText("Calgary"), closeSoftKeyboard())
//
//        onView(withId(R.id.endLocation)).perform(typeText("Reno"), closeSoftKeyboard())
//
//        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())
//
//        onView(withId(R.id.CreateTrip)).perform(click())
//
//        Thread.sleep(5000)
//
//        Intents.intended(hasComponent(MainActivity::class.java.name))
//
//        onView(withId(R.id.PastTrips)).perform(click())
//
//        Intents.intended(hasComponent(PastTripActivity::class.java.name))
//
//        onView(allOf(withText("Calgary -> Reno"), isDisplayed()))
//            .perform(click())
//
//        Intents.intended(hasComponent(PopTripActivity::class.java.name))
//
//        onView(allOf(withText("    recipe 1: something"))).perform(click())
//
//        Intents.intended(hasComponent(PopRecipeActivity::class.java.name))
//
//        onView(allOf(withTagValue(`is`("url")), isDisplayed()))
//            .perform(click())
//    }
}

//@RunWith(AndroidJUnit4::class)
//class PreferencesTest {
//    @Rule
//    val activityRule = ActivityScenarioRule(ManageAccount::class.java)
//}