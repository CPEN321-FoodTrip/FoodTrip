package com.example.FoodTripFrontend

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
import java.util.function.Predicate.not
import android.os.IBinder
import android.view.WindowManager
import androidx.test.espresso.Root
import androidx.test.espresso.intent.matcher.IntentMatchers
import org.hamcrest.Description
import org.hamcrest.TypeSafeMatcher

object MobileViewMatchers {
    // Custom matcher for checking if a view is a Toast message
    fun isToast(): Matcher<Root> {
        return ToastMatcher()
    }
}

class ToastMatcher : TypeSafeMatcher<Root>() {

    override fun describeTo(description: Description?) {
        description?.appendText("is toast")
    }

    override fun matchesSafely(root: Root): Boolean {
        val type = root.windowLayoutParams.get().type
        if (type == WindowManager.LayoutParams.TYPE_TOAST) {
            val windowToken: IBinder = root.decorView.windowToken
            val appToken: IBinder = root.decorView.applicationWindowToken
            // windowToken == appToken means this window isn't contained by any other windows.
            // if it was a window for an activity, it would have TYPE_BASE_APPLICATION.
            return windowToken == appToken
        }
        return false
    }
}

/**
 * Instrumented test, which will execute on an Android device.
 *
 * See [testing documentation](http://d.android.com/tools/testing).
 */
@RunWith(AndroidJUnit4::class)
class LoginActivityTest {

    @Rule
    val activityRule = ActivityScenarioRule(LoginActivity::class.java)

    @Before
    fun setup() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }

    @Test fun userSignIn() {
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        onView(withId(R.id.sign_in_button_user)).perform(click())

        Intents.intended(IntentMatchers.hasComponent(MainActivity::class.java.name))

    }

    @Test fun adminSignIn() {
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        onView(withId(R.id.sign_in_button_admin)).perform(click())

        Intents.intended(IntentMatchers.hasComponent(MainActivityAdmin::class.java.name))
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

    @Rule
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

}

@RunWith(AndroidJUnit4::class)
class MainActivityAdminTest {

}

@RunWith(AndroidJUnit4::class)
class TripActivityTest {
    @Rule
    val activityRule = ActivityScenarioRule(TripActivity::class.java)

    @Before
    fun setup() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }

    @Test fun planRegularTrip() {
        onView(withId(R.id.startLocation)).perform(typeText("Beijing"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("Beijing")))

        onView(withId(R.id.endLocation)).perform(typeText("Hanoi"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("Hanoi")))

        onView(withId(R.id.numstops)).perform(typeText("3"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("3")))

        onView(withId(R.id.CreateTrip)).perform(click())

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

        onView(withText("Create Trip"))
            .inRoot(MobileViewMatchers.isToast())
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

        onView(withText("Create Trip"))
            .inRoot(MobileViewMatchers.isToast())
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

        onView(withText("Create Trip"))
            .inRoot(MobileViewMatchers.isToast())
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

        onView(withText("Create Trip"))
            .inRoot(MobileViewMatchers.isToast())
            .check(matches(isDisplayed()))
    }

    @Test fun missingInputsStart() {
        onView(withId(R.id.endLocation)).perform(typeText("Hanoi"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("Hanoi")))

        onView(withId(R.id.numstops)).perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("0")))

        onView(withId(R.id.CreateTrip)).perform(click())

        onView(withText("Create Trip"))
            .inRoot(MobileViewMatchers.isToast())
            .check(matches(isDisplayed()))
    }

    @Test fun missingInputsEnd() {
        onView(withId(R.id.startLocation)).perform(typeText("Beijing"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("Beijing")))

        onView(withId(R.id.numstops)).perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.numstops)).check(matches(withText("0")))

        onView(withId(R.id.CreateTrip)).perform(click())

        onView(withText("Create Trip"))
            .inRoot(MobileViewMatchers.isToast())
            .check(matches(isDisplayed()))
    }

    @Test fun missingInputsStops() {
        onView(withId(R.id.startLocation)).perform(typeText("Beijing"), closeSoftKeyboard())
        onView(withId(R.id.startLocation)).check(matches(withText("Beijing")))

        onView(withId(R.id.endLocation)).perform(typeText("Hanoi"), closeSoftKeyboard())
        onView(withId(R.id.endLocation)).check(matches(withText("Hanoi")))

        onView(withId(R.id.CreateTrip)).perform(click())

        onView(withText("Create Trip"))
            .inRoot(MobileViewMatchers.isToast())
            .check(matches(isDisplayed()))
    }
}

@RunWith(AndroidJUnit4::class)
class PastTripActivityTest {

}

@RunWith(AndroidJUnit4::class)
class GroceryActivityTest {

}

@RunWith(AndroidJUnit4::class)
class RecipeActivityTest {

}

@RunWith(AndroidJUnit4::class)
class SocialsActivityTest {

}