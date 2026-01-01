import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const title = formData.get('title') as string || '';
        const text = formData.get('text') as string || '';
        const url = formData.get('url') as string || '';
        const file = formData.get('file') as File | null;

        // Combine text parts for the description
        const description = [title, text, url].filter(Boolean).join(' ').trim();
        const safeDesc = encodeURIComponent(description);

        if (!file) {
            // No file, just redirect normally
            const redirectUrl = new URL('/dashboard/expenses', request.url);
            redirectUrl.searchParams.set('shared', 'true');
            if (description) {
                redirectUrl.searchParams.set('description', description);
            }
            return NextResponse.redirect(redirectUrl, 303);
        }

        // Processing File: Convert to Base64 to embed in HTML
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = file.type;
        const fileName = file.name;

        // HTML Response that saves to IDB then redirects
        // We use vanilla IndexedDB matching 'idb-keyval' defaults (db: keyval-store, store: keyval)
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Processing Share...</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        p { margin-top: 20px; color: #666; }
    </style>
</head>
<body>
    <div class="spinner"></div>
    <p>Processing text...</p>
    <script>
        const base64 = "${base64}";
        const mimeType = "${mimeType}";
        const fileName = "${fileName}";
        const description = "${safeDesc}";

        function saveAndRedirect() {
            try {
                // Decode Base64
                const binaryString = window.atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: mimeType });
                const file = new File([blob], fileName, { type: mimeType });

                // Open Default idb-keyval DB
                const req = indexedDB.open('keyval-store');
                
                req.onupgradeneeded = function(e) {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('keyval')) {
                        db.createObjectStore('keyval');
                    }
                };

                req.onsuccess = function(e) {
                    const db = e.target.result;
                    const tx = db.transaction(['keyval'], 'readwrite');
                    const store = tx.objectStore('keyval');
                    
                    // 'shared-file' is the key expected by ExpenseForm
                    store.put(file, 'shared-file');

                    tx.oncomplete = function() {
                        window.location.href = '/dashboard/expenses?shared=true&description=' + description;
                    };
                    
                    tx.onerror = function() {
                        console.error('IDB Transaction Error');
                        window.location.href = '/dashboard/expenses?shared=true&error=idb_tx&description=' + description;
                    };
                };

                req.onerror = function() {
                    console.error('IDB Open Error');
                    window.location.href = '/dashboard/expenses?shared=true&error=idb_open&description=' + description;
                };

            } catch (err) {
                console.error(err);
                window.location.href = '/dashboard/expenses?shared=true&error=process&description=' + description;
            }
        }

        // Run
        saveAndRedirect();
    </script>
</body>
</html>
        `;

        return new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (error) {
        console.error('Error handling share target:', error);
        return NextResponse.redirect(new URL('/dashboard/expenses', request.url), 303);
    }
}
