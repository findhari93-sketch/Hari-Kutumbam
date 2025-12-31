import { useState, useEffect } from 'react';
import { SendIntent } from 'capacitor-plugin-send-intent';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export const useShareIntent = () => {
    const router = useRouter();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const checkIntent = async () => {
            try {
                const intent = await (SendIntent as any).checkSendIntentReceived();
                if (!intent) return;

                console.log('Share Intent Received:', intent);

                if (intent.files && intent.files.length > 0) {
                    const sharedFile = intent.files[0];
                    // Create a URL for the file
                    // If the plugin returns a path we can read, we convert it.
                    // Usually 'path' is absolute filesystem path.
                    // We need to fetch it to a Blob to behave like a File object for our Form.

                    // We can pass this data via a global store, context, or query param.
                    // Passing a full Blob via query param is impossible.
                    // Passing via IDB is good (reusing existing PWA logic!).

                    const fileUrl = Capacitor.convertFileSrc(sharedFile.path || sharedFile.contentUri);
                    const response = await fetch(fileUrl);
                    const blob = await response.blob();
                    const file = new File([blob], sharedFile.name || 'shared_image', { type: blob.type || sharedFile.mimeType });

                    // Dynamically import idb-keyval to avoid SSR issues if any, though this is client-side effect.
                    const { set } = await import('idb-keyval');
                    await set('shared-file', file);

                    // Redirect to expenses page with shared flag
                    router.push('/dashboard/expenses?shared=true');
                } else if (intent.text) {
                    // Handle text share (e.g. as description)
                    router.push(`/dashboard/expenses?description=${encodeURIComponent(intent.text)}`);
                } else if (intent.url) {
                    router.push(`/dashboard/expenses?description=${encodeURIComponent(intent.url)}`);
                }
            } catch (err) {
                console.error('Error checking share intent:', err);
            }
        };

        checkIntent();

        // Listen for future intents if plugin supports it or if app is resumed.
        // SendIntent usually relies on checkSendIntentReceived being called. 
        // Some versions emit events. We'll stick to check for now as it handles 'cold start'.
        // For 'warm start' (app in background), we might need an event listener on 'appUrlOpen' or similar, 
        // but SendIntent plugin documentation says checkSendIntentReceived works? 
        // Actually, for warm start, we might need to listen to 'sendIntentReceived' event if available.
        // Or check on 'resume' app state change.

    }, [router]);
};
