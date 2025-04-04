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
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import com.google.firebase.FirebaseApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.security.MessageDigest
import java.util.UUID

/**
 * Activity handles google sign-in functionality
 * If sign-in as user, direct to regular user mode
 * If sign-in as admin, direct to admin mode
 */
class LoginActivity : AppCompatActivity() {

    /**
     * Companion object for LoginActivity.
     * Stores static constants related to the activity.
     */
    companion object {
        private const val TAG = "LoginActivity"
    }

    private val activityScope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_login)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        FirebaseApp.initializeApp(this)

        findViewById<Button>(R.id.sign_in_button_user).setOnClickListener() {
            signInUsers("user")
        }

        findViewById<Button>(R.id.sign_in_button_admin).setOnClickListener() {
            signInUsers("admin")
        }

    }

    private fun signInUsers(accountType: String) {
        Log.d(TAG, "$accountType Sign In Clicked")
        Log.d(TAG, "WEB_CLIENT_ID: ${BuildConfig.WEB_CLIENT_ID}")

        val credentialManager = CredentialManager.create(this)
        val signInWithGoogleOption: GetSignInWithGoogleOption = GetSignInWithGoogleOption
            .Builder(BuildConfig.WEB_CLIENT_ID)
            .setNonce(generateHashedNonce())
            .build()

        val request: GetCredentialRequest = GetCredentialRequest.Builder()
            .addCredentialOption(signInWithGoogleOption)
            .build()

        activityScope.launch {
            try {
                val result = credentialManager.getCredential(
                    request = request,
                    context = this@LoginActivity,
                )
                handleSignIn(result, accountType)
            } catch (e: GetCredentialException) {
                handleFailure(e)
            }
        }
    }

    private fun handleSignIn(result: GetCredentialResponse, accountType: String) {
        // Handle the successfully returned credential.
        val credential = result.credential

        when (credential) {
            is CustomCredential -> {
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    try {
                        // Use googleIdTokenCredential and extract id to validate and
                        // authenticate on your server.
                        val googleIdTokenCredential = GoogleIdTokenCredential
                            .createFrom(credential.data)
                        Log.d(
                            TAG,
                            "Received Google ID token: ${googleIdTokenCredential.idToken.take(10)}"
                        )

                        val displayName = googleIdTokenCredential.displayName.toString()
                        val email = googleIdTokenCredential.id


                        val sharedPref = getSharedPreferences("UserData", MODE_PRIVATE)
                        val editor = sharedPref.edit()
                        editor.putString("userEmail", email)
                        editor.putString("userName", displayName)
                        editor.apply()

                        updateWelcomeMessage("$displayName - $accountType", accountType)
                    } catch (e: GoogleIdTokenParsingException) {
                        Log.e(TAG, "Received an invalid google id token response", e)
                    }
                } else {
                    // Catch any unrecognized credential type here.
                    Log.e(TAG, "Unexpected type of credential")
                }
            }

            else -> {
                // Catch any unrecognized credential type here.
                Log.e(TAG, "Unexpected type of credential")
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        activityScope.cancel()
    }

    private fun handleFailure(e: GetCredentialException) {
        Log.e(TAG, "Error getting Credential", e)
        Toast.makeText(this, "Error getting Credential", Toast.LENGTH_SHORT).show()
    }

    private fun updateWelcomeMessage(name: String, accountType: String) {
        Toast.makeText(this, "Welcome $name", Toast.LENGTH_SHORT).show()

        if (accountType == "user") {
            val intent = Intent(this, MainActivity::class.java)
            intent.putExtra("USER_NAME", name)
            startActivity(intent)
            finish()
        } else if (accountType == "admin") {
            val intent = Intent(this, GroceryStoreActivity::class.java)
            intent.putExtra("USER_NAME", name)
            Log.d(TAG, "Starting")
            startActivity(intent)
            finish()
        } else {
            Log.e(TAG, "Error getting account type")
            Toast.makeText(this, "Error getting account type", Toast.LENGTH_SHORT).show()
        }
    }

    private fun generateHashedNonce(): String {
        val rawNonce = UUID.randomUUID().toString()
        val bytes = rawNonce.toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        return digest.fold("") {str, it -> str + "%02x".format(it)}
    }
}