package com.screenmirror

import android.app.*
import android.content.Intent
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.IBinder
import android.view.WindowManager
import io.socket.client.IO
import io.socket.client.Socket
import org.webrtc.*
import org.json.JSONObject

class ScreenCaptureService : Service() {
    private var mediaProjection: MediaProjection? = null
    private var socket: Socket? = null
    private var peerConnection: PeerConnection? = null
    private var videoSource: VideoSource? = null
    private var videoTrack: VideoTrack? = null
    private var surfaceTextureHelper: SurfaceTextureHelper? = null
    private var videoCapturer: VideoCapturer? = null
    private lateinit var peerConnectionFactory: PeerConnectionFactory
    
    override fun onCreate() {
        super.onCreate()
        initializeWebRTC()
        connectToSignalingServer()
    }

    private fun initializeWebRTC() {
        val initializationOptions = PeerConnectionFactory.InitializationOptions
            .builder(applicationContext)
            .setEnableInternalTracer(true)
            .createInitializationOptions()
        PeerConnectionFactory.initialize(initializationOptions)

        val options = PeerConnectionFactory.Options()
        peerConnectionFactory = PeerConnectionFactory.builder()
            .setOptions(options)
            .createPeerConnectionFactory()

        val windowManager = getSystemService(WindowManager::class.java)
        val displayMetrics = windowManager.defaultDisplay.let {
            android.util.DisplayMetrics().also { metrics ->
                it.getMetrics(metrics)
            }
        }

        videoSource = peerConnectionFactory.createVideoSource(false)
        surfaceTextureHelper = SurfaceTextureHelper.create("CaptureThread", EglBase.create().eglBaseContext)
    }

    private fun connectToSignalingServer() {
        val options = IO.Options().apply {
            reconnection = true
            reconnectionAttempts = -1 // Tentativi infiniti di riconnessione
            reconnectionDelay = 1000
            transports = arrayOf("websocket")
        }
        
        socket = IO.socket("https://armony.onrender.com", options).apply {
            on(Socket.EVENT_CONNECT) {
                startScreenCapture()
            }
            on(Socket.EVENT_DISCONNECT) {
                // Riconnessione automatica gestita da Socket.IO
            }
            connect()
        }
    }

    private fun startScreenCapture() {
        mediaProjection?.let { projection ->
            videoCapturer = createScreenCapturer(projection)
            videoCapturer?.initialize(surfaceTextureHelper, applicationContext, videoSource?.capturerObserver)
            videoCapturer?.startCapture(1280, 720, 30)
            
            videoTrack = peerConnectionFactory.createVideoTrack("screen_track", videoSource)
            
            videoTrack?.let { track ->
                socket?.emit("stream-data", JSONObject().apply {
                    put("track", track)
                })
            }
        }
    }

    private fun createScreenCapturer(mediaProjection: MediaProjection): VideoCapturer {
        return ScreenCapturerAndroid(
            mediaProjection,
            object : MediaProjection.Callback() {
                override fun onStop() {
                    // Riavvia automaticamente la cattura se viene interrotta
                    startScreenCapture()
                }
            }
        )
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.let {
            val resultCode = it.getIntExtra("resultCode", Activity.RESULT_CANCELED)
            val data = it.getParcelableExtra<Intent>("resultData")
            
            if (resultCode != Activity.RESULT_OK || data == null) {
                stopSelf()
                return START_NOT_STICKY
            }

            val mediaProjectionManager = getSystemService(MediaProjectionManager::class.java)
            mediaProjection = mediaProjectionManager.getMediaProjection(resultCode, data)
        }
        
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        videoCapturer?.dispose()
        videoSource?.dispose()
        surfaceTextureHelper?.dispose()
        mediaProjection?.stop()
        socket?.disconnect()
        peerConnection?.dispose()
        super.onDestroy()
    }
}