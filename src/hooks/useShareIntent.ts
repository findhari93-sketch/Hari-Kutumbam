import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useShareIntent = () => {
    const router = useRouter();

    useEffect(() => {
        // Guard against non-browser environments
        if (typeof window === 'undefined') return;

        const init = async () => {
            try {
                // Dynamic import to avoid build-time errors with Capacitor
                const { Capacitor } = await import('@capacitor/core');
                if (!Capacitor.isNativePlatform()) return;

                const { SendIntent } = await import('capacitor-plugin-send-intent');

                const intent = await (SendIntent as any).checkSendIntentReceived();
                if (!intent) return;

                console.log('Share Intent Received:', intent);

                if (intent.files && intent.files.length > 0) {
                    const sharedFile = intent.files[0];
                    const fileUrl = Capacitor.convertFileSrc(sharedFile.path || sharedFile.contentUri);
                    const response = await fetch(fileUrl);
                    const blob = await response.blob();
                    const file = new File([blob], sharedFile.name || 'shared_image', { type: blob.type || sharedFile.mimeType });

                    const { set } = await import('idb-keyval');
                    await set('shared-file', file);

                    router.push('/dashboard/expenses?shared=true');
                } else if (intent.text) {
                    router.push(`/dashboard/expenses?description=${encodeURIComponent(intent.text)}`);
                } else if (intent.url) {
                    router.push(`/dashboard/expenses?description=${encodeURIComponent(intent.url)}`);
                }
            } catch (err) {
                console.error('Error checking share intent:', err);
            }
        };

        init();
    }, [router]);
};
