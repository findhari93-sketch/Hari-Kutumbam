import { db } from './firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

const API_KEY = 'goldapi-cvc4m19mjjqw194-io';
const BASE_URL = 'https://www.goldapi.io/api/';
const RETAIL_MARKUP = 1.075;

export interface GoldRate {
    price24k: number;
    price22k: number;
    currency: string;
    timestamp: number;
    city?: string;
    session?: string; // 'morning' | 'evening'
}

export interface HistoricalRate {
    date: string; // YYYY-MM-DD
    price24k: number;
    price22k: number;
    isMock?: boolean;
}

const calculateRetail = (spotPrice: number) => Math.round(spotPrice * RETAIL_MARKUP);

// Helper to generate a date string YYYY-MM-DD
const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

export const fetchGoldRate = async (city: string = 'India'): Promise<GoldRate | null> => {
    const now = new Date();
    const todayStr = formatDate(now);
    const docId = `${city}_${todayStr}`;
    const currentHour = now.getHours();

    // Session Definition: Morning < 4 PM, Evening >= 4 PM (16:00)
    // This allows capturing the closing/evening rate which is often definitive.
    const isEveningSession = currentHour >= 16;
    const sessionLabel = isEveningSession ? 'evening' : 'morning';

    // 1. Try Cache/DB
    try {
        const docRef = doc(db, 'gold_daily_rates', docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const lastSession = data.session || 'morning'; // Default to morning for old data

            // Smart Cache Logic:
            // If we have data, we usually return it.
            // ONLY re-fetch if: It is now Evening (>= 16:00) AND the stored data is from Morning/Early.
            const shouldRefetch = isEveningSession && lastSession === 'morning';

            if (!shouldRefetch) {
                // console.log(`[GoldRate] Serving from Cache (${lastSession})`);
                return {
                    price24k: data.price24k,
                    price22k: data.price22k,
                    currency: 'INR',
                    timestamp: data.timestamp,
                    city,
                    session: lastSession
                };
            }
            console.log(`[GoldRate] Refreshing for Evening Update...`);
        }
    } catch (e) {
        console.warn("Firestore read failed", e);
    }

    // 2. Fetch API
    try {
        console.log(`[GoldRate] Live API Call for ${city}...`);
        const response = await fetch(`${BASE_URL}XAU/INR`, {
            method: 'GET',
            headers: { 'x-access-token': API_KEY, 'Content-Type': 'application/json' }
        });

        if (response.status === 403) {
            console.warn("[GoldRate] API Key Limit/Invalid. Switching to Mock Data.");
            throw new Error("GOLD_API_403");
        }
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        const pricePerOunce = data.price;
        const spot24 = pricePerOunce / 31.1035;
        const spot22 = spot24 * 0.916;

        let cityAdjustment = 0;
        if (city.toLowerCase() === 'chennai') cityAdjustment = 10;
        else if (city.toLowerCase() === 'trichy') cityAdjustment = 5;
        else if (city.toLowerCase() === 'pudukkottai') cityAdjustment = -5;

        const rateData = {
            price24k: calculateRetail(spot24 + cityAdjustment),
            price22k: calculateRetail(spot22 + cityAdjustment),
            currency: 'INR',
            timestamp: data.timestamp,
            city,
            session: sessionLabel
        };

        // 3. Store in DB
        try {
            await setDoc(doc(db, 'gold_daily_rates', docId), {
                ...rateData,
                date: todayStr,
                source: 'api',
                updatedAt: Timestamp.now()
            });
        } catch (e) { console.error("DB Write Error", e); }

        return rateData;

    } catch (error: any) {
        if (error.message !== 'GOLD_API_403') {
            console.error('Error fetching gold rate:', error);
        }
        // Fallback or Mock (Updated estimates 2025)
        return {
            price24k: 7850,
            price22k: 7200,
            currency: 'INR',
            timestamp: Date.now(),
            city: city || 'Unknown'
        };
    }
};

export const fetchHistoricalRates = async (city: string = 'India', days: number = 30): Promise<HistoricalRate[]> => {
    const today = new Date();
    const targetDates: string[] = [];
    const limitDays = days > 365 ? 365 : days;

    for (let i = limitDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        targetDates.push(formatDate(d));
    }

    const finalRates: HistoricalRate[] = [];
    const missingDates: string[] = [];

    // 1. Check DB
    try {
        const startDate = targetDates[0];
        const q = query(
            collection(db, 'gold_daily_rates'),
            where('city', '==', city),
            where('date', '>=', startDate)
        );
        const snapshot = await getDocs(q);
        const dbMap = new Map();
        snapshot.forEach(doc => dbMap.set(doc.data().date, doc.data()));

        targetDates.forEach(date => {
            if (dbMap.has(date)) {
                const d = dbMap.get(date);
                finalRates.push({ date, price24k: d.price24k, price22k: d.price22k, isMock: d.source === 'mock' });
            } else {
                missingDates.push(date);
            }
        });
    } catch (e) {
        missingDates.push(...targetDates);
    }

    if (missingDates.length === 0) return finalRates.sort((a, b) => a.date.localeCompare(b.date));

    // 2. Fallback Generation for Missing Dates
    let anchorPrice = 7600; // Updated anchor
    const liveRate = await fetchGoldRate(city);
    if (liveRate) anchorPrice = liveRate.price24k;

    const mockCurve = generateMockCurve(anchorPrice, limitDays, city);
    const mockMap = new Map(mockCurve.map(m => [m.date, m]));

    for (const date of missingDates) {
        const mock = mockMap.get(date);
        if (mock) {
            const entry = { ...mock, isMock: true };
            finalRates.push(entry);
            // Save mock to DB to persist the "history"
            setDoc(doc(db, 'gold_daily_rates', `${city}_${date}`), {
                ...entry,
                city,
                source: 'mock'
            }).catch(e => { });
        }
    }

    return finalRates.sort((a, b) => a.date.localeCompare(b.date));
};

const generateMockCurve = (endPrice: number, days: number, city: string): HistoricalRate[] => {
    const data: HistoricalRate[] = [];
    let current = endPrice;
    const volatility = 0.005 + (city.length % 3) * 0.001;

    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(new Date().getDate() - i);
        const dateStr = formatDate(d);

        data.push({
            date: dateStr,
            price24k: Math.round(current),
            price22k: Math.round(current * 0.916),
            isMock: true
        });

        // Evolve price for "yesterday"
        const change = 1 + (Math.random() * (volatility * 2) - volatility);
        current = current / change;
    }
    return data.reverse();
};
