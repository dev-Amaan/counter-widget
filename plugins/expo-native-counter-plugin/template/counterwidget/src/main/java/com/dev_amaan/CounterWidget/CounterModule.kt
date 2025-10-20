package com.dev_amaan.counterwidget

import android.content.Context
import android.content.Intent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import com.facebook.react.bridge.*

class CounterModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val PREF_NAME = "counter_prefs"
        private const val KEY_COUNT = "saved_count"
    }

    override fun getName(): String = "CounterModule"

    @ReactMethod
    fun getSharedCount(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            val count = prefs.getInt(KEY_COUNT, 0)
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("GET_COUNT_ERROR", e)
        }
    }

    @ReactMethod
    fun setSharedCount(value: Int, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            prefs.edit().putInt(KEY_COUNT, value).apply()

            // Notify widget to update
            val intent = Intent(reactContext, HomeScreenWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                val ids = AppWidgetManager.getInstance(reactContext)
                    .getAppWidgetIds(ComponentName(reactContext, HomeScreenWidget::class.java))
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            reactContext.sendBroadcast(intent)

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_COUNT_ERROR", e)
        }
    }
}