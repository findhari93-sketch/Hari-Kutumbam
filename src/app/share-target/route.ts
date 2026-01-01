import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const title = formData.get('title') as string || '';
        const text = formData.get('text') as string || '';
        const url = formData.get('url') as string || '';

        // Combine text parts for the description
        // GPay usually sends the transaction details in 'text'
        let description = [title, text, url].filter(Boolean).join(' ').trim();

        // Construct redirect URL
        // We use 303 See Other to ensure the browser redirects with a GET request
        const redirectUrl = new URL('/dashboard/expenses', request.url);
        redirectUrl.searchParams.set('shared', 'true');

        if (description) {
            redirectUrl.searchParams.set('description', description);
        }

        return NextResponse.redirect(redirectUrl, 303);
    } catch (error) {
        console.error('Error handling share target:', error);
        // Fallback redirect on error
        return NextResponse.redirect(new URL('/dashboard/expenses', request.url), 303);
    }
}
