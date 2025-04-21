package com.screenmirror

import android.app.Activity
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.getSystemService

class MainActivity : AppCompatActivity() {
    private val SCREEN_CAPTURE_REQUEST_CODE = 1001
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        startScreenCapture()
    }

    private fun startScreenCapture() {
        val mediaProjectionManager = getSystemService<MediaProjectionManager>()
        mediaProjectionManager?.let {
            startActivityForResult(
                it.createScreenCaptureIntent(),
                SCREEN_CAPTURE_REQUEST_CODE
            )
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == SCREEN_CAPTURE_REQUEST_CODE && resultCode == Activity.RESULT_OK) {
            val intent = Intent(this, ScreenCaptureService::class.java).apply {
                putExtra("resultCode", resultCode)
                putExtra("resultData", data)
            }
            startForegroundService(intent)
            // Chiudi l'activity dopo aver avviato il servizio
            finish()
        } else {
            // Se l'utente rifiuta il permesso, chiudi l'app
            finish()
        }
    }
}