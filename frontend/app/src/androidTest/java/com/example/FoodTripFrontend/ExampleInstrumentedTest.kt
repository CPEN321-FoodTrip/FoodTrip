package com.example.FoodTripFrontend

import android.credentials.CredentialManager
import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.closeSoftKeyboard
import androidx.test.espresso.action.ViewActions.typeText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.RootMatchers.withDecorView
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.espresso.intent.matcher.IntentMatchers.hasComponent
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.uiautomator.UiDevice
import com.google.android.gms.maps.SupportMapFragment
import org.hamcrest.Matcher
import org.junit.After

import org.junit.Test
import org.junit.runner.RunWith

import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule

import androidx.test.espresso.intent.matcher.IntentMatchers
import com.google.android.gms.maps.GoogleMap


@RunWith(AndroidJUnit4::class)
class LoginActivityTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(LoginActivity::class.java)

    @Before
    fun setup() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }

    @Test
    fun userSignIn() {

        onView(withId(R.id.sign_in_button_user)).perform(click())

    }

    @Test fun adminSignIn() {

        onView(withId(R.id.sign_in_button_admin)).perform(click())

    }
}

@RunWith(AndroidJUnit4::class)
class MainActivityTest {

    @Before
    fun setup() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @Test fun checkElements() {
        onView(withId(R.id.PastTrips)).check(matches(withText("View Past Trips")))
        onView(withId(R.id.ManageTrip)).check(matches(withText("Manage Trip")))
        onView(withId(R.id.viewRecipes)).check(matches(withText("View Recipes")))
        onView(withId(R.id.ManageAccount)).check(matches(withText("Manage Account")))
    }

    @Test fun checkManageTrip() {
        onView(withId(R.id.ManageTrip)).perform(click())
        Intents.intended(IntentMatchers.hasComponent(TripActivity::class.java.name))
    }

    @Test fun checkPastTrips() {
        onView(withId(R.id.PastTrips)).perform(click())
        Intents.intended(IntentMatchers.hasComponent(PastTripActivity::class.java.name))

    }

    @Test fun checkViewRecipe() {
        onView(withId(R.id.viewRecipes)).perform(click())
        Intents.intended(IntentMatchers.hasComponent(GroceryActivity::class.java.name))

    }

    @Test fun checkAccount() {
        onView(withId(R.id.ManageAccount)).perform(click())
        Intents.intended(IntentMatchers.hasComponent(AccountActivity::class.java.name))

    }

    @Test fun signOut() {
        onView(withId(R.id.sign_out_button)).check(matches(withText("Sign Out")))

        onView(withId(R.id.sign_out_button)).perform(click())

        Intents.intended(IntentMatchers.hasComponent(LoginActivity::class.java.name))
    }

}

@RunWith(AndroidJUnit4::class)
class MainActivityAdminTest {
    @Before
    fun setup() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivityAdmin::class.java)

    @Test fun setGroceriesButton() {
        onView(withId(R.id.GroceryButton)).perform(click())
        Intents.intended(hasComponent(GroceryStoreActivity::class.java.name))
    }

}

@RunWith(AndroidJUnit4::class)
class TripActivityTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(TripActivity::class.java)


    @Before
    fun setup() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }


    private lateinit var googleMap: GoogleMap


    @Test fun planRegularTripShort() {
        onView(withId(R.id.startLocation)).perform(typeText("Calgary"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("Calgary")))

        onView(withId(R.id.endLocation)).perform(typeText("Vancouver"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("Vancouver")))

        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("3")))

        onView(withId(R.id.CreateTrip)).perform(click())

        Thread.sleep(5000)

        Intents.intended(hasComponent(MainActivity::class.java.name))

        onView(withId(R.id.map)).check(matches(isDisplayed()))
    }

    @Test fun planRegularTripLong() {
        onView(withId(R.id.startLocation)).perform(typeText("Calgary"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("Calgary")))

        onView(withId(R.id.endLocation)).perform(typeText("Vancouver"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("Vancouver")))

        onView(withId(R.id.numstops)).perform(typeText("10"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("10")))

        onView(withId(R.id.CreateTrip)).perform(click())

        Thread.sleep(5000)

        Intents.intended(hasComponent(MainActivity::class.java.name))

        onView(withId(R.id.map)).check(matches(isDisplayed()))
    }


    @Test fun wrongStart() {
        onView(withId(R.id.startLocation)).perform(typeText("asdkf;a"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("asdkf;a")))

        onView(withId(R.id.endLocation)).perform(typeText("Hanoi"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("Hanoi")))

        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("3")))

        onView(withId(R.id.CreateTrip)).perform(click())

        Thread.sleep(1000)

        onView(withText("Invalid Start City"))
            .check(matches(isDisplayed()))

    }

    @Test fun wrongEnd() {
        onView(withId(R.id.startLocation)).perform(typeText("Beijing"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("Beijing")))

        onView(withId(R.id.endLocation)).perform(typeText("ghdioadfk"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("ghdioadfk")))

        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("3")))

        onView(withId(R.id.CreateTrip)).perform(click())

        Thread.sleep(1000)

        onView(withText("Invalid End City"))
            .check(matches(isDisplayed()))
    }

    @Test fun sameStartEnd() {
        onView(withId(R.id.startLocation)).perform(typeText("Beijing"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("Beijing")))

        onView(withId(R.id.endLocation)).perform(typeText("Beijing"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("Beijing")))

        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("3")))

        onView(withId(R.id.CreateTrip)).perform(click())

        Thread.sleep(1000)

        onView(withText("Route Cannot Have Same Start/End"))
            .check(matches(isDisplayed()))
    }

    @Test fun wrongStopsAmount() {
        onView(withId(R.id.startLocation)).perform(typeText("Beijing"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("Beijing")))

        onView(withId(R.id.endLocation)).perform(typeText("Hanoi"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("Hanoi")))

        onView(withId(R.id.numstops)).perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("0")))

        onView(withId(R.id.CreateTrip)).perform(click())

        Thread.sleep(1000)

        onView(withText("Invalid Number of Stops"))
            .check(matches(isDisplayed()))
    }

    @Test fun missingInputsStart() {
        onView(withId(R.id.endLocation)).perform(typeText("Hanoi"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("Hanoi")))

        onView(withId(R.id.numstops)).perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("0")))

        onView(withId(R.id.CreateTrip)).perform(click())

        Thread.sleep(1000)

        onView(withText("Missing Start City"))
            .check(matches(isDisplayed()))
    }

    @Test fun missingInputsEnd() {
        onView(withId(R.id.startLocation)).perform(typeText("Beijing"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("Beijing")))

        onView(withId(R.id.numstops)).perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("0")))

        onView(withId(R.id.CreateTrip)).perform(click())

        Thread.sleep(1000)

        onView(withText("Missing End City"))
            .check(matches(isDisplayed()))
    }

    @Test fun missingInputsStops() {
        onView(withId(R.id.startLocation)).perform(typeText("Beijing"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("Beijing")))

        onView(withId(R.id.endLocation)).perform(typeText("Hanoi"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("Hanoi")))

        onView(withId(R.id.CreateTrip)).perform(click())

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
//@RunWith(AndroidJUnit4::class)
//class PastTripActivityTest {
//    @Rule
//    val activityRule = ActivityScenarioRule(PastTripActivity::class.java)
//}
//
//@RunWith(AndroidJUnit4::class)
//class GroceryActivityTest {
//    @Rule
//    val activityRule = ActivityScenarioRule(GroceryActivity::class.java)
//}
//
//@RunWith(AndroidJUnit4::class)
//class GroceryStoreActivityTest {
//    @Rule
//    val activityRule = ActivityScenarioRule(GroceryStoreActivity::class.java)
//}
//
//@RunWith(AndroidJUnit4::class)
//class RecipeActivityTest {
//    @Rule
//    val activityRule = ActivityScenarioRule(PopRecipeActivity::class.java)
//}

//@RunWith(AndroidJUnit4::class)
//class SocialsActivityTest {
//    @Rule
//    val activityRule = ActivityScenarioRule(SocialsActivity::class.java)
//}