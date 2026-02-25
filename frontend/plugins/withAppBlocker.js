/**
 * Expo Config Plugin — App Blocker (Android)
 *
 * Automatically injects during `npx expo prebuild`:
 *   1. Permissions in AndroidManifest (PACKAGE_USAGE_STATS, SYSTEM_ALERT_WINDOW, FOREGROUND_SERVICE, etc.)
 *   2. Service declaration in AndroidManifest
 *   3. Native Java files (AppBlockerModule, AppBlockerPackage, AppBlockerService) into android/
 *   4. Registers the native package in MainApplication.kt
 *
 * The AppBlockerService is a Foreground Service that:
 *   - Runs persistently even when the app is in the background
 *   - Polls UsageStatsManager every 1s to detect blocked apps in foreground
 *   - Brings the app to front and emits "onAppBlocked" event to JS
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

      // Ensure directory exists
      fs.mkdirSync(javaDir, { recursive: true });

      // ── AppBlockerService.java (Foreground Service) ──
      fs.writeFileSync(
        path.join(javaDir, 'AppBlockerService.java'),
        getAppBlockerServiceSource(packageName)
      );

      // ── AppBlockerModule.java (React Native bridge) ──
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
  config = addPermissionsAndService(config);
  config = writeNativeFiles(config);
  config = registerPackage(config);
  return config;
}

module.exports = withAppBlocker;

// ─────────────────────────────────────────────────────────────
// AppBlockerService.java — Foreground Service
// This runs independently of the React Native JS thread.
// It polls UsageStatsManager and brings the app to front
// when a blocked app is detected.
// ─────────────────────────────────────────────────────────────

function getAppBlockerServiceSource(packageName) {
  return `package ${packageName};

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.provider.Settings;
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

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        handlerThread = new HandlerThread("AppBlockerPollThread");
        handlerThread.start();
        handler = new Handler(handlerThread.getLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, buildNotification());
        loadRestricted();
        startPolling();
        // If system kills us, restart
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
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
                handler.postDelayed(this, POLL_MS);
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
        SharedPreferences prefs = prefs();
        if (!prefs.getBoolean(KEY_ENABLED, true)) return;

        long unlock = prefs.getLong(KEY_UNLOCK, 0);
        if (unlock > 0 && System.currentTimeMillis() < unlock) return;

        // Reload restricted apps on every poll to pick up changes
        loadRestricted();
        if (restricted.isEmpty()) return;

        String fg = detectForeground();
        if (fg == null) return;

        // Don't block ourselves
        if (fg.equals(getPackageName())) return;

        if (restricted.contains(fg)) {
            long now = System.currentTimeMillis();
            // Debounce: don't re-trigger for the same app within 3 seconds
            if (fg.equals(lastBlocked) && now - lastBlockedTime < 3000) return;
            lastBlocked = fg;
            lastBlockedTime = now;

            Log.d(TAG, "Blocked app detected: " + fg + ", bringing to front");
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
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                i.putExtra("blocked", true);
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
// Now delegates monitoring to the Foreground Service.
// ─────────────────────────────────────────────────────────────

function getAppBlockerModuleSource(packageName) {
  return `package ${packageName};

import android.app.ActivityManager;
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

import java.util.HashSet;
import java.util.Set;

/**
 * React Native bridge for app blocking.
 * Delegates actual monitoring to AppBlockerService (foreground service).
 * Listens for the app being brought to front by the service and emits
 * "onAppBlocked" events to JS.
 */
public class AppBlockerModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

    private static final String TAG = "AppBlockerModule";
    private static final String MODULE_NAME = "AppBlockerModule";
    private static final String PREFS_NAME = "app_blocker_prefs";
    private static final String KEY_RESTRICTED = "restricted_apps";
    private static final String KEY_ENABLED = "blocking_enabled";
    private static final String KEY_UNLOCK = "unlock_expiry";

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
        // When the app resumes, check if it was because a blocked app was detected
        try {
            android.app.Activity activity = ctx.getCurrentActivity();
            if (activity != null && activity.getIntent() != null) {
                Intent intent = activity.getIntent();
                if (intent.getBooleanExtra("blocked", false)) {
                    // Clear the flag so we don't re-trigger
                    intent.removeExtra("blocked");

                    // Detect which app was in foreground before us
                    String blockedApp = detectPreviousForeground();
                    if (blockedApp != null) {
                        emitBlocked(blockedApp);
                    } else {
                        emitBlocked("unknown");
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "onHostResume error", e);
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
            p.resolve(true);
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void setBlockingEnabled(boolean enabled, Promise p) {
        try {
            prefs().edit().putBoolean(KEY_ENABLED, enabled).apply();
            if (!enabled) {
                stopService();
            } else if (serviceRunning) {
                // Restart service to pick up the change
                startService();
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
        if (!checkUsageStats()) {
            p.reject("NO_PERMISSION", "Usage stats permission not granted");
            return;
        }
        if (!Settings.canDrawOverlays(ctx)) {
            p.reject("NO_OVERLAY", "Overlay permission not granted");
            return;
        }
        try {
            startService();
            p.resolve(true);
        } catch (Exception e) {
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

    // Required for NativeEventEmitter
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

    private String detectPreviousForeground() {
        try {
            UsageStatsManager usm = (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return null;
            long now = System.currentTimeMillis();
            UsageEvents events = usm.queryEvents(now - 5000, now);
            UsageEvents.Event event = new UsageEvents.Event();
            String last = null;
            String secondLast = null;
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                    secondLast = last;
                    last = event.getPackageName();
                }
            }
            // last is us (we just resumed), secondLast is the blocked app
            if (last != null && last.equals(ctx.getPackageName()) && secondLast != null) {
                return secondLast;
            }
            return secondLast != null ? secondLast : last;
        } catch (Exception e) {
            return null;
        }
    }

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

    private void emitBlocked(String pkg) {
        try {
            WritableMap map = Arguments.createMap();
            map.putString("blockedApp", pkg);
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
               .emit("onAppBlocked", map);
        } catch (Exception e) {
            Log.e(TAG, "emitBlocked error", e);
        }
    }

    private boolean checkUsageStats() {
        AppOpsManager ops = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
        int mode = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), ctx.getPackageName());
        return mode == AppOpsManager.MODE_ALLOWED;
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
