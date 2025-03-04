package com.example.FoodTripFrontend

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }
    private val activityScope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        findViewById<Button>(R.id.PastTrips).setOnClickListener() {
            val intent = Intent(this, PastTripActivity::class.java)

            startActivity(intent)
        }
        findViewById<Button>(R.id.ManageTrip).setOnClickListener() {
            val intent = Intent(this, TripActivity::class.java)

            startActivity(intent)
        }
        findViewById<Button>(R.id.ManageAccount).setOnClickListener() {
            val intent = Intent(this, AccountActivity::class.java)

            startActivity(intent)
        }

        findViewById<Button>(R.id.sign_out_button).setOnClickListener() {
            Log.d(TAG, "Sign Out Button Clicked")

            val credentialManager = CredentialManager.create(this)
            activityScope.launch {
                try {
                    credentialManager.clearCredentialState(ClearCredentialStateRequest())
                    Toast.makeText(
                        this@MainActivity,
                        "Logged Out Successfully",
                        Toast.LENGTH_SHORT
                    ).show()
                    gotologin()
                } catch (e: Exception) {
                    Log.e(TAG, "Error clearing credential state", e)
                    Toast.makeText(
                        this@MainActivity,
                        "Error clearing credentials",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }

    private fun gotologin() {
        val intent = Intent(this, LoginActivity::class.java)
        startActivity(intent)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        activityScope.cancel()
    }

}