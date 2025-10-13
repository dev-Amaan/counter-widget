package com.dev_amaan.CounterWidget

import android.content.Context
import android.content.SharedPreferences
import android.util.AttributeSet
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.RCTEventEmitter

class CounterView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : LinearLayout(context, attrs, defStyleAttr) {

    private var count = 0
    private val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    private val counterText: TextView = TextView(context).apply {
        textSize = 24f
    }

    private val buttonIncrease: Button = Button(context).apply {
        text = "Increase"
        setOnClickListener { increase() }
    }

    private val buttonDecrease: Button = Button(context).apply {
        text = "Decrease"
        setOnClickListener { decrease() }
    }

    init {
        orientation = VERTICAL
        
        count = prefs.getInt(KEY_COUNT, 0)
        updateCounterText()
        updateDecreaseButtonState()

        addView(counterText)
        addView(buttonIncrease)
        addView(buttonDecrease)
    }

    private fun updateCounterText() {
        counterText.text = "Count: $count"
    }

    private fun updateDecreaseButtonState() {
        buttonDecrease.isEnabled = count > 0
    }

    private fun saveCount() {
        prefs.edit().putInt(KEY_COUNT, count).apply()
    }

    fun getCount(): Int = count

    fun increase() {
        count++
        updateCounterText()
        updateDecreaseButtonState()
        saveCount()
        sendCountEvent()
    }

    fun decrease() {
        if (count > 0) {
            count--
            updateCounterText()
            updateDecreaseButtonState()
            saveCount()
            sendCountEvent()
        }
    }

    fun sendInitialCount() {
        val event = Arguments.createMap().apply {
            putInt("count", count)
        }
        if (context is ThemedReactContext) {
            val themedContext = context as ThemedReactContext
            themedContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "onCountChange", event)
        }
    }

    private fun sendCountEvent() {
        if (context is ThemedReactContext) {
            val themedContext = context as ThemedReactContext
            val event = Arguments.createMap().apply {
                putInt("count", count)
            }
            themedContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, "onCountChange", event)
        }
    }


    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        sendCountEvent()
    }

    companion object {
        private const val PREF_NAME = "counter_prefs"
        private const val KEY_COUNT = "saved_count"
    }
}