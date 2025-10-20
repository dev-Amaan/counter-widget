package com.dev_amaan.counterwidget

import android.content.Context
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

    fun getCount(): Int = count

    fun setCount(newCount: Int) {
        count = newCount
        updateCounterText()
        updateDecreaseButtonState()
    }

    fun increase() {
        count++
        updateCounterText()
        updateDecreaseButtonState()
        sendCountEvent()
    }

    fun decrease() {
        if (count > 0) {
            count--
            updateCounterText()
            updateDecreaseButtonState()
            sendCountEvent()
        }
    }

    private fun sendCountEvent() {
        if (context is ThemedReactContext && isAttachedToWindow) {
            val event = Arguments.createMap().apply { putInt(KEY_COUNT, count) }
            (context as ThemedReactContext).getJSModule(RCTEventEmitter::class.java)
                .receiveEvent(id, "onCountChange", event)
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        sendCountEvent() // send initial count when view is attached
    }

    companion object {
        const val KEY_COUNT = "saved_count"
    }
}