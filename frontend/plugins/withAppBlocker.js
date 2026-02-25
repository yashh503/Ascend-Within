/**
 * Expo Config Plugin — App Blocker (Android)
 *
 * Automatically injects during `npx expo prebuild`:
 *   1. PACKAGE_USAGE_STATS + SYSTEM_ALERT_WINDOW permissions in AndroidManifest
 *   2. Native Java files (AppBlockerModule + AppBlockerPackage) into android/
 *   3. Registers the native package in MainApplication.kt
 *
 * Usage in app.json:
 *   "plugins": ["./plugins/withAppBlocker"]
 *
 * Then just run:
 *   npx expo prebuild --clean
 *   npx expo run:android
 */

const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// STEP 1: Add permissions to AndroidManifest.xml
// ─────────────────────────────────────────────────────────────
function addPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.$) manifest.$ = {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const permsToAdd = [
      {
        'android:name': 'android.permission.PACKAGE_USAGE_STATS',
        'tools:ignore': 'ProtectedPermissions',
      },
      { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' },
      { 'android:name': 'android.permission.FOREGROUND_SERVICE' },
    ];

    for (const perm of permsToAdd) {
      const name = perm['android:name'];
      const exists = manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === name
      );
      if (!exists) {
        manifest['uses-permission'].push({ $: perm });
      }
    }

    return config;
  });
}

// ─────────────────────────────────────────────────────────────
// STEP 2: Write native Java source files into android/
// ─────────────────────────────────────────────────────────────
function writeNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package || 'com.monkmode.app';
      const packagePath = packageName.replace(/\./g, '/');
      const javaDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        packagePath
      );

      // Ensure directory exists
      fs.mkdirSync(javaDir, { recursive: true });

      // ── AppBlockerModule.java ──
      fs.writeFileSync(
        path.join(javaDir, 'AppBlockerModule.java'),
        getAppBlockerModuleSource(packageName)
      );

      // ── AppBlockerPackage.java ──
      fs.writeFileSync(
        path.join(javaDir, 'AppBlockerPackage.java'),
        getAppBlockerPackageSource(packageName)
      );

      return config;
    },
  ]);
}

// ─────────────────────────────────────────────────────────────
// STEP 3: Register AppBlockerPackage in MainApplication
// ─────────────────────────────────────────────────────────────
function registerPackage(config) {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    const language = config.modResults.language; // 'java' or 'kt'

    if (language === 'kt' || contents.includes('class MainApplication')) {
      // Kotlin MainApplication (Expo SDK 50+)
      if (!contents.includes('AppBlockerPackage')) {
        // Add import
        contents = contents.replace(
          /^(package .+\n)/m,
          `$1\nimport ${config.android?.package || 'com.monkmode.app'}.AppBlockerPackage\n`
        );

        // Add to getPackages — find the PackageList line and append
        if (contents.includes('PackageList(this).packages')) {
          contents = contents.replace(
            'PackageList(this).packages',
            'PackageList(this).packages.apply { add(AppBlockerPackage()) }'
          );
        } else if (contents.includes('PackageList(this)')) {
          // Alternative pattern
          contents = contents.replace(
            /override fun getPackages\(\): List<ReactPackage> \{([\s\S]*?)return (PackageList\(this\)[\s\S]*?)(\n\s*\})/m,
            (match, before, pkgList, end) => {
              return `override fun getPackages(): List<ReactPackage> {${before}val packages = ${pkgList}.toMutableList()\n      packages.add(AppBlockerPackage())\n      return packages${end}`;
            }
          );
        }
      }
    } else {
      // Java MainApplication (older Expo)
      if (!contents.includes('AppBlockerPackage')) {
        contents = contents.replace(
          /^(package .+;)/m,
          `$1\nimport ${config.android?.package || 'com.monkmode.app'}.AppBlockerPackage;`
        );

        contents = contents.replace(
          'return packages;',
          'packages.add(new AppBlockerPackage());\n          return packages;'
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });
}

// ─────────────────────────────────────────────────────────────
// Main plugin export
// ─────────────────────────────────────────────────────────────
function withAppBlocker(config) {
  config = addPermissions(config);
  config = writeNativeFiles(config);
  config = registerPackage(config);
  return config;
}

module.exports = withAppBlocker;

// ─────────────────────────────────────────────────────────────
// Native Java source code
// ─────────────────────────────────────────────────────────────

function getAppBlockerModuleSource(packageName) {
  return `package ${packageName};

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONArray;

import java.util.HashSet;
import java.util.Set;

/**
 * Native module for detecting foreground apps via UsageStatsManager.
 * Polls every 1.5s and emits "onAppBlocked" when a restricted app is detected.
 */
public class AppBlockerModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "AppBlockerModule";
    private static final String PREFS_NAME = "app_blocker_prefs";
    private static final String KEY_RESTRICTED = "restricted_apps";
    private static final String KEY_ENABLED = "blocking_enabled";
    private static final String KEY_UNLOCK = "unlock_expiry";
    private static final int POLL_MS = 1500;

    private final ReactApplicationContext ctx;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable pollRunnable;
    private boolean monitoring = false;
    private Set<String> restricted = new HashSet<>();
    private String lastBlocked = "";
    private long lastBlockedTime = 0;

    public AppBlockerModule(ReactApplicationContext ctx) {
        super(ctx);
        this.ctx = ctx;
    }

    @NonNull
    @Override
    public String getName() { return MODULE_NAME; }

    // ── Permission checks ─────────────────────────

    @ReactMethod
    public void hasUsageStatsPermission(Promise p) {
        try { p.resolve(checkUsageStats()); }
        catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void openUsageStatsSettings(Promise p) {
        try {
            Intent i = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
            p.resolve(true);
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void hasOverlayPermission(Promise p) {
        try { p.resolve(Settings.canDrawOverlays(ctx)); }
        catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void openOverlaySettings(Promise p) {
        try {
            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + ctx.getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
            p.resolve(true);
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    // ── Configuration ─────────────────────────────

    @ReactMethod
    public void setRestrictedApps(ReadableArray apps, Promise p) {
        try {
            restricted.clear();
            JSONArray arr = new JSONArray();
            for (int i = 0; i < apps.size(); i++) {
                String pkg = apps.getString(i);
                restricted.add(pkg);
                arr.put(pkg);
            }
            prefs().edit().putString(KEY_RESTRICTED, arr.toString()).apply();
            p.resolve(true);
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void setBlockingEnabled(boolean enabled, Promise p) {
        try {
            prefs().edit().putBoolean(KEY_ENABLED, enabled).apply();
            p.resolve(true);
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void setUnlockExpiry(double expiryMs, Promise p) {
        try {
            prefs().edit().putLong(KEY_UNLOCK, (long) expiryMs).apply();
            p.resolve(true);
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    // ── Monitoring ────────────────────────────────

    @ReactMethod
    public void startMonitoring(Promise p) {
        if (monitoring) { p.resolve(true); return; }
        if (!checkUsageStats()) {
            p.reject("NO_PERMISSION", "Usage stats permission not granted");
            return;
        }
        loadRestricted();
        monitoring = true;
        pollRunnable = new Runnable() {
            @Override
            public void run() {
                if (!monitoring) return;
                poll();
                handler.postDelayed(this, POLL_MS);
            }
        };
        handler.post(pollRunnable);
        p.resolve(true);
    }

    @ReactMethod
    public void stopMonitoring(Promise p) {
        monitoring = false;
        if (pollRunnable != null) handler.removeCallbacks(pollRunnable);
        pollRunnable = null;
        p.resolve(true);
    }

    @ReactMethod
    public void getForegroundApp(Promise p) {
        try { p.resolve(detectForeground()); }
        catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    // ── Internal ──────────────────────────────────

    private void poll() {
        if (!prefs().getBoolean(KEY_ENABLED, true)) return;
        long unlock = prefs().getLong(KEY_UNLOCK, 0);
        if (unlock > 0 && System.currentTimeMillis() < unlock) return;

        String fg = detectForeground();
        if (fg != null && restricted.contains(fg)) {
            // Debounce: don't re-trigger for the same app within 5 seconds
            long now = System.currentTimeMillis();
            if (fg.equals(lastBlocked) && now - lastBlockedTime < 5000) return;
            lastBlocked = fg;
            lastBlockedTime = now;

            bringToFront();
            emit(fg);
        }
    }

    private String detectForeground() {
        try {
            UsageStatsManager usm = (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
            long now = System.currentTimeMillis();
            UsageEvents events = usm.queryEvents(now - 5000, now);
            UsageEvents.Event event = new UsageEvents.Event();
            String last = null;
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                    last = event.getPackageName();
                }
            }
            return last;
        } catch (Exception e) { return null; }
    }

    private void bringToFront() {
        try {
            Intent i = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
            if (i != null) {
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                ctx.startActivity(i);
            }
        } catch (Exception e) { /* silent */ }
    }

    private void emit(String pkg) {
        try {
            WritableMap map = Arguments.createMap();
            map.putString("blockedApp", pkg);
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
               .emit("onAppBlocked", map);
        } catch (Exception e) { /* JS not ready */ }
    }

    private boolean checkUsageStats() {
        AppOpsManager ops = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
        int mode = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), ctx.getPackageName());
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    private void loadRestricted() {
        restricted.clear();
        try {
            JSONArray arr = new JSONArray(prefs().getString(KEY_RESTRICTED, "[]"));
            for (int i = 0; i < arr.length(); i++) restricted.add(arr.getString(i));
        } catch (Exception e) { /* silent */ }
    }

    private SharedPreferences prefs() {
        return ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
}
`;
}

function getAppBlockerPackageSource(packageName) {
  return `package ${packageName};

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AppBlockerPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext ctx) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new AppBlockerModule(ctx));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext ctx) {
        return Collections.emptyList();
    }
}
`;
}
