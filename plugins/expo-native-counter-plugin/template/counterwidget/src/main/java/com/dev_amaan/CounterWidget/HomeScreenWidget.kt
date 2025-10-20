package com.dev_amaan.counterwidget

import android.appwidget.AppWidgetProvider
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.app.PendingIntent
import android.content.ComponentName
import android.util.Log
import android.widget.RemoteViews
import com.dev_amaan.counterwidget.R

class HomeScreenWidget : AppWidgetProvider() {

    companion object {
        private const val ACTION_INCREMENT = "ACTION_INCREMENT"
        private const val ACTION_DECREMENT = "ACTION_DECREMENT"
        private const val PREF_NAME = "counter_prefs"
        private const val KEY_COUNT = "saved_count"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        super.onReceive(context, intent)
        if (context == null || intent == null) return

        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        var count = prefs.getInt(KEY_COUNT, 0)

        when (intent.action) {
            ACTION_INCREMENT -> count++
            ACTION_DECREMENT -> if (count > 0) count--
        }

        prefs.edit().putInt(KEY_COUNT, count).apply()

        // Notify all widget instances of update
        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(
            ComponentName(context, HomeScreenWidget::class.java)
        )
        updateWidgets(context, manager, ids, count)

        Log.d("HomeScreenWidget", "Count updated: $count, action: ${intent.action}")
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
        val count = prefs.getInt(KEY_COUNT, 0)
        updateWidgets(context, appWidgetManager, appWidgetIds, count)
    }

    private fun updateWidgets(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray, count: Int) {
        for ((index, id) in appWidgetIds.withIndex()) {
            val views = RemoteViews(context.packageName, R.layout.layout_widget)
            views.setTextViewText(R.id.text_count, count.toString())

            // Unique PendingIntents per widget
            val incrementIntent = Intent(context, HomeScreenWidget::class.java).apply { action = ACTION_INCREMENT }
            val decrementIntent = Intent(context, HomeScreenWidget::class.java).apply { action = ACTION_DECREMENT }

            val incPending = PendingIntent.getBroadcast(context, id * 2, incrementIntent, PendingIntent.FLAG_IMMUTABLE)
            val decPending = PendingIntent.getBroadcast(context, id * 2 + 1, decrementIntent, PendingIntent.FLAG_IMMUTABLE)

            views.setOnClickPendingIntent(R.id.button_plus, incPending)
            views.setOnClickPendingIntent(R.id.button_minus, decPending)

            appWidgetManager.updateAppWidget(id, views)
        }
    }
}