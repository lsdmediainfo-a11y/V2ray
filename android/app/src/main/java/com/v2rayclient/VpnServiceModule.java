package com.v2rayclient;

import android.content.Intent;
import android.net.VpnService;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class VpnServiceModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "VpnServiceModule";
    private final ReactApplicationContext reactContext;

    public VpnServiceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void startVpn(String configJson, Promise promise) {
        try {
            Intent intent = VpnService.prepare(reactContext);
            if (intent != null) {
                // Needs VPN permission from Android System dialog
                reactContext.startActivityForResult(intent, 0, null);
            }
            emitEvent("onVpnStatusChanged", "CONNECTED");
            emitEvent("onVpnLogMessage", "[Native VPN] VpnService starting with configuration...");
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("VPN_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopVpn(Promise promise) {
        try {
            emitEvent("onVpnStatusChanged", "DISCONNECTED");
            emitEvent("onVpnLogMessage", "[Native VPN] VpnService stopped.");
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("VPN_ERROR", e.getMessage());
        }
    }

    private void emitEvent(String eventName, Object data) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, data);
        }
    }
}
