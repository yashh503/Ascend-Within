/**
 * Expo Config Plugin — App Blocker (Android)
 *
 * Automatically injects during `npx expo prebuild`:
 *   1. Permissions in AndroidManifest
 *   2. Service declaration in AndroidManifest
 *   3. Native Java files (AppBlockerModule, AppBlockerPackage, AppBlockerService)
 *   4. Registers the native package in MainApplication.kt
 *
 * Usage in app.json:
 *   "plugins": ["./plugins/withAppBlocker"]
 *
 * Then run:
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
// STEP 1: Add permissions + service declaration to AndroidManifest.xml
// ─────────────────────────────────────────────────────────────
function addPermissionsAndService(config) {
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
      { 'android:name': 'android.permission.FOREGROUND_SERVICE_SPECIAL_USE' },
      { 'android:name': 'android.permission.POST_NOTIFICATIONS' },
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

    // Add the service declaration inside <application>
    const application = manifest.application?.[0];
    if (application) {
      if (!application.service) {
        application.service = [];
      }

      const packageName = config.android?.package || 'com.monkmode.app';
      const serviceName = `${packageName}.AppBlockerService`;
      const serviceExists = application.service.some(
        (s) => s.$?.['android:name'] === serviceName
      );

      if (!serviceExists) {
        application.service.push({
          $: {
            'android:name': serviceName,
            'android:enabled': 'true',
            'android:exported': 'false',
            'android:foregroundServiceType': 'specialUse',
          },
          'property': [
            {
              $: {
                'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
                'android:value': 'App blocking service that monitors foreground apps to enforce digital discipline restrictions',
              },
            },
          ],
        });
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

      fs.mkdirSync(javaDir, { recursive: true });

      // ── Splash screen drawable (fixes missing splashscreen_logo) ──
      const drawableDir = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'drawable'
      );
      fs.mkdirSync(drawableDir, { recursive: true });
      const splashPath = path.join(drawableDir, 'splashscreen_logo.xml');
      if (!fs.existsSync(splashPath)) {
        fs.writeFileSync(splashPath, `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="100dp"
    android:height="100dp"
    android:viewportWidth="100"
    android:viewportHeight="100">
    <path
        android:fillColor="#FAFAF8"
        android:pathData="M0,0h100v100H0z" />
</vector>
`);
      }

      // ── AppBlockerService.java ──
      fs.writeFileSync(
        path.join(javaDir, 'AppBlockerService.java'),
        getAppBlockerServiceSource(packageName)
      );

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
    const language = config.modResults.language;

    if (language === 'kt' || contents.includes('class MainApplication')) {
      if (!contents.includes('AppBlockerPackage')) {
        contents = contents.replace(
          /^(package .+\n)/m,
          `$1\nimport ${config.android?.package || 'com.monkmode.app'}.AppBlockerPackage\n`
        );

        if (contents.includes('PackageList(this).packages')) {
          contents = contents.replace(
            'PackageList(this).packages',
            'PackageList(this).packages.apply { add(AppBlockerPackage()) }'
          );
        } else if (contents.includes('PackageList(this)')) {
          contents = contents.replace(
            /override fun getPackages\(\): List<ReactPackage> \{([\s\S]*?)return (PackageList\(this\)[\s\S]*?)(\n\s*\})/m,
            (match, before, pkgList, end) => {
              return `override fun getPackages(): List<ReactPackage> {${before}val packages = ${pkgList}.toMutableList()\n      packages.add(AppBlockerPackage())\n      return packages${end}`;
            }
          );
        }
      }
    } else {
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
  config = addPermissionsAndService(config);
  config = writeNativeFiles(config);
  config = registerPackage(config);
  return config;
}

module.exports = withAppBlocker;

// ─────────────────────────────────────────────────────────────
// AppBlockerService.java — Foreground Service
//
// KEY DESIGN: Uses a static flag (AppBlockerModule.pendingBlock)
// to communicate with the module, because singleTask activity
// doesn't update getIntent() — it calls onNewIntent() which
// React Native doesn't expose. So instead:
//   1. Service sets AppBlockerModule.pendingBlock = true
//   2. Service launches our activity (brings to front)
//   3. Module's onHostResume() checks the static flag
//   4. Module emits "onAppBlocked" to JS
// ─────────────────────────────────────────────────────────────

function getAppBlockerServiceSource(packageName) {
  return `package ${packageName};

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.util.Log;

import org.json.JSONArray;

import java.util.HashSet;
import java.util.Set;

public class AppBlockerService extends Service {

    private static final String TAG = "AppBlockerService";
    private static final String CHANNEL_ID = "app_blocker_channel";
    private static final int NOTIFICATION_ID = 9999;
    private static final String PREFS_NAME = "app_blocker_prefs";
    private static final String KEY_RESTRICTED = "restricted_apps";
    private static final String KEY_ENABLED = "blocking_enabled";
    private static final String KEY_UNLOCK = "unlock_expiry";
    private static final int POLL_MS = 1000;

    private HandlerThread handlerThread;
    private Handler handler;
    private Runnable pollRunnable;
    private Set<String> restricted = new HashSet<>();
    private String lastBlocked = "";
    private long lastBlockedTime = 0;
    private int pollCount = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");
        createNotificationChannel();
        handlerThread = new HandlerThread("AppBlockerPollThread");
        handlerThread.start();
        handler = new Handler(handlerThread.getLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service started");
        startForeground(NOTIFICATION_ID, buildNotification());
        loadRestricted();
        Log.d(TAG, "Restricted apps loaded: " + restricted.size() + " apps: " + restricted);
        startPolling();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "Service destroyed");
        stopPolling();
        if (handlerThread != null) {
            handlerThread.quitSafely();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "App Blocker",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitors app usage for digital discipline");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        return builder
            .setContentTitle("Ascend Within")
            .setContentText("Digital discipline is active")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(pi)
            .setOngoing(true)
            .build();
    }

    private void startPolling() {
        stopPolling();
        pollRunnable = new Runnable() {
            @Override
            public void run() {
                try {
                    poll();
                } catch (Exception e) {
                    Log.e(TAG, "Poll error", e);
                }
                if (handler != null) {
                    handler.postDelayed(this, POLL_MS);
                }
            }
        };
        handler.post(pollRunnable);
    }

    private void stopPolling() {
        if (pollRunnable != null && handler != null) {
            handler.removeCallbacks(pollRunnable);
            pollRunnable = null;
        }
    }

    private void poll() {
        pollCount++;
        SharedPreferences prefs = prefs();
        boolean enabled = prefs.getBoolean(KEY_ENABLED, true);
        if (!enabled) {
            if (pollCount % 30 == 0) Log.d(TAG, "poll #" + pollCount + " — blocking DISABLED, skipping");
            return;
        }

        long unlock = prefs.getLong(KEY_UNLOCK, 0);
        if (unlock > 0 && System.currentTimeMillis() < unlock) {
            if (pollCount % 30 == 0) Log.d(TAG, "poll #" + pollCount + " — unlock active, skipping");
            return;
        }

        // Reload restricted apps on every poll to pick up changes
        loadRestricted();
        if (restricted.isEmpty()) {
            if (pollCount % 30 == 0) Log.d(TAG, "poll #" + pollCount + " — NO restricted apps");
            return;
        }

        String fg = detectForeground();
        if (pollCount % 10 == 0) {
            Log.d(TAG, "poll #" + pollCount + " — fg=" + fg + " restricted=" + restricted.size());
        }
        if (fg == null) return;
        if (fg.equals(getPackageName())) return;

        if (restricted.contains(fg)) {
            long now = System.currentTimeMillis();
            if (fg.equals(lastBlocked) && now - lastBlockedTime < 3000) {
                Log.d(TAG, "poll — throttled (same app within 3s): " + fg);
                return;
            }
            lastBlocked = fg;
            lastBlockedTime = now;

            Log.d(TAG, "BLOCKED APP DETECTED: " + fg + " — bringing app to front");

            // Set the static flag BEFORE launching the activity
            AppBlockerModule.pendingBlock = true;
            AppBlockerModule.pendingBlockedApp = fg;

            bringToFront();
        }
    }

    private String detectForeground() {
        try {
            UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return null;
            long now = System.currentTimeMillis();
            UsageEvents events = usm.queryEvents(now - 3000, now);
            UsageEvents.Event event = new UsageEvents.Event();
            String last = null;
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                    last = event.getPackageName();
                }
            }
            return last;
        } catch (Exception e) {
            Log.e(TAG, "detectForeground error", e);
            return null;
        }
    }

    private void bringToFront() {
        try {
            Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (i != null) {
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                startActivity(i);
            }
        } catch (Exception e) {
            Log.e(TAG, "bringToFront error", e);
        }
    }

    private void loadRestricted() {
        restricted.clear();
        try {
            String json = prefs().getString(KEY_RESTRICTED, "[]");
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                restricted.add(arr.getString(i));
            }
        } catch (Exception e) {
            Log.e(TAG, "loadRestricted error", e);
        }
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
}
`;
}

// ─────────────────────────────────────────────────────────────
// AppBlockerModule.java — React Native bridge
//
// Uses static pendingBlock/pendingBlockedApp flags set by the
// service. onHostResume() checks these flags and emits the
// "onAppBlocked" event to JS.
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
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONArray;

public class AppBlockerModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

    private static final String TAG = "AppBlockerModule";
    private static final String MODULE_NAME = "AppBlockerModule";
    private static final String PREFS_NAME = "app_blocker_prefs";
    private static final String KEY_RESTRICTED = "restricted_apps";
    private static final String KEY_ENABLED = "blocking_enabled";
    private static final String KEY_UNLOCK = "unlock_expiry";

    // Static flags set by AppBlockerService when a blocked app is detected.
    // This avoids the singleTask/onNewIntent problem with intent extras.
    public static volatile boolean pendingBlock = false;
    public static volatile String pendingBlockedApp = null;

    private final ReactApplicationContext ctx;
    private boolean serviceRunning = false;

    public AppBlockerModule(ReactApplicationContext ctx) {
        super(ctx);
        this.ctx = ctx;
        ctx.addLifecycleEventListener(this);
    }

    @NonNull
    @Override
    public String getName() { return MODULE_NAME; }

    // ── Lifecycle — detect when service brings us to front ──

    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume — pendingBlock=" + pendingBlock);
        if (pendingBlock) {
            final String app = pendingBlockedApp != null ? pendingBlockedApp : "unknown";
            pendingBlock = false;
            pendingBlockedApp = null;

            // Delay slightly to ensure JS bridge is fully ready after resume
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                Log.d(TAG, "Emitting onAppBlocked for: " + app);
                emitBlocked(app);
            }, 300);
        }
    }

    @Override
    public void onHostPause() {}

    @Override
    public void onHostDestroy() {}

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
            JSONArray arr = new JSONArray();
            for (int i = 0; i < apps.size(); i++) {
                arr.put(apps.getString(i));
            }
            prefs().edit().putString(KEY_RESTRICTED, arr.toString()).apply();
            Log.d(TAG, "setRestrictedApps: " + arr.toString());
            p.resolve(true);
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void setBlockingEnabled(boolean enabled, Promise p) {
        try {
            prefs().edit().putBoolean(KEY_ENABLED, enabled).apply();
            Log.d(TAG, "setBlockingEnabled: " + enabled);
            if (!enabled && serviceRunning) {
                stopService();
            }
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

    // ── Monitoring (starts/stops the foreground service) ──

    @ReactMethod
    public void startMonitoring(Promise p) {
        Log.d(TAG, "startMonitoring called");
        Log.d(TAG, "  usageStats=" + checkUsageStats());
        Log.d(TAG, "  overlay=" + Settings.canDrawOverlays(ctx));

        if (!checkUsageStats()) {
            Log.w(TAG, "Usage stats permission NOT granted — service will start but detection may not work");
        }
        if (!Settings.canDrawOverlays(ctx)) {
            Log.w(TAG, "Overlay permission NOT granted — bringToFront may not work");
        }

        try {
            startService();
            Log.d(TAG, "Foreground service STARTED successfully");
            p.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start service", e);
            p.reject("ERR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopMonitoring(Promise p) {
        try {
            stopService();
            p.resolve(true);
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void getForegroundApp(Promise p) {
        try { p.resolve(detectCurrentForeground()); }
        catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(int count) {}

    // ── Service management ────────────────────────

    private void startService() {
        Intent intent = new Intent(ctx, AppBlockerService.class);
        ContextCompat.startForegroundService(ctx, intent);
        serviceRunning = true;
    }

    private void stopService() {
        Intent intent = new Intent(ctx, AppBlockerService.class);
        ctx.stopService(intent);
        serviceRunning = false;
    }

    // ── Internal ──────────────────────────────────

    private String detectCurrentForeground() {
        try {
            UsageStatsManager usm = (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return null;
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

    private void emitBlocked(final String pkg) {
        emitBlockedWithRetry(pkg, 0);
    }

    private void emitBlockedWithRetry(final String pkg, final int attempt) {
        try {
            if (!ctx.hasActiveReactInstance()) {
                Log.w(TAG, "No active React instance, retry attempt " + attempt);
                if (attempt < 5) {
                    new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                        emitBlockedWithRetry(pkg, attempt + 1);
                    }, 200);
                }
                return;
            }
            WritableMap map = Arguments.createMap();
            map.putString("blockedApp", pkg);
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
               .emit("onAppBlocked", map);
            Log.d(TAG, "onAppBlocked event EMITTED for: " + pkg + " (attempt " + attempt + ")");
        } catch (Exception e) {
            Log.e(TAG, "emitBlocked error (attempt " + attempt + ")", e);
            if (attempt < 5) {
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    emitBlockedWithRetry(pkg, attempt + 1);
                }, 200);
            }
        }
    }

    private boolean checkUsageStats() {
        android.app.AppOpsManager ops = (android.app.AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
        int mode = ops.checkOpNoThrow(android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), ctx.getPackageName());
        return mode == android.app.AppOpsManager.MODE_ALLOWED;
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
