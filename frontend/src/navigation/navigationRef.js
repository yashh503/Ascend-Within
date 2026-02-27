import { createRef } from 'react';
import { CommonActions } from '@react-navigation/native';

export const navigationRef = createRef();

export let isNavigationReady = false;

export function setNavigationReady(ready) {
  isNavigationReady = ready;
}

export function navigate(name, params) {
  if (navigationRef.current && isNavigationReady) {
    navigationRef.current.navigate(name, params);
  } else {
    console.warn('[navigationRef] navigate called but ref not ready');
  }
}

/**
 * Force-navigate to a screen using reset — bypasses React Navigation's
 * deduplication logic and ensures the screen is shown even during rapid
 * lifecycle transitions.
 */
export function forceNavigate(name, params) {
  if (navigationRef.current && isNavigationReady) {
    console.log('[navigationRef] forceNavigate to:', name);
    navigationRef.current.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' },
          { name, params },
        ],
      })
    );
  } else {
    console.warn('[navigationRef] forceNavigate called but ref not ready, queuing...');
    // Queue the navigation for when ref becomes ready
    const interval = setInterval(() => {
      if (navigationRef.current && isNavigationReady) {
        clearInterval(interval);
        console.log('[navigationRef] forceNavigate (queued) to:', name);
        navigationRef.current.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              { name: 'MainTabs' },
              { name, params },
            ],
          })
        );
      }
    }, 100);
    // Safety: clear interval after 3 seconds
    setTimeout(() => clearInterval(interval), 3000);
  }
}
