package com.dev_amaan.counterwidget

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.common.MapBuilder

class CounterViewManager : SimpleViewManager<CounterView>() {

    companion object {
        const val REACT_CLASS = "NativeCounterView"
        private const val COMMAND_INCREASE = 1
        private const val COMMAND_DECREASE = 2
    }

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): CounterView {
        return CounterView(reactContext)
    }

    override fun getCommandsMap(): Map<String, Int> {
        return mapOf(
            "increase" to COMMAND_INCREASE,
            "decrease" to COMMAND_DECREASE
        )
    }

    override fun receiveCommand(
        view: CounterView,
        commandId: Int,
        args: ReadableArray?
    ) {
        when (commandId) {
            COMMAND_INCREASE -> view.increase()
            COMMAND_DECREASE -> view.decrease()
        }
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
        return MapBuilder.of(
            "onCountChange",
            MapBuilder.of("registrationName", "onCountChange")
        )
    }
}