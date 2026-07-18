package com.v2ray.compose

import android.app.Application
import com.v2ray.compose.data.AppDatabase

class V2RayApplication : Application() {
    val database: AppDatabase by lazy { AppDatabase.getDatabase(this) }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: V2RayApplication
            private set
    }
}
