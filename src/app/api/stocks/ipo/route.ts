import { NextResponse } from 'next/server';

// NSE India API for real IPO data
const NSE_BASE_URL = 'https://www.nseindia.com';

const getHeaders = (cookie?: string) => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/',
    'Connection': 'keep-alive',
    ...(cookie && { 'Cookie': cookie })
});

// Cache
let cachedCookies: string | null = null;
let cookieExpiry: number = 0;
let ipoCache: { data: any; expiry: number } | null = null;

async function getCookies(): Promise<string> {
    const now = Date.now();
    if (cachedCookies && now < cookieExpiry) {
        return cachedCookies;
    }

    try {
        const response = await fetch(NSE_BASE_URL, {
            method: 'GET',
            headers: getHeaders()
        });
        
        const cookies = response.headers.get('set-cookie') || '';
        cachedCookies = cookies;
        cookieExpiry = now + 5 * 60 * 1000;
        return cookies;
    } catch (error) {
        console.error('Failed to get NSE cookies:', error);
        return '';
    }
}

async function fetchNSEData(endpoint: string): Promise<any> {
    const cookies = await getCookies();
    
    const response = await fetch(`${NSE_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(cookies),
    });

    if (!response.ok) {
        throw new Error(`NSE API error: ${response.status}`);
    }

    return response.json();
}

interface IPO {
    id: string;
    companyName: string;
    symbol?: string;
    priceRange: string;
    lotSize: number;
    issueSize: string;
    openDate: string;
    closeDate: string;
    listingDate?: string;
    listingPrice?: number;
    listingGain?: string;
    status: 'upcoming' | 'open' | 'closed' | 'listed';
    category: string;
    exchange: string;
}

// Format currency in Indian style
function formatCurrency(value: number): string {
    if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
        return `₹${(value / 100000).toFixed(2)} L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
}

// Parse NSE IPO data into our format
function parseNSEIPO(nseIPO: any, status: 'upcoming' | 'open' | 'listed'): IPO {
    // NSE returns issuePrice as a string like "Rs.367 to Rs.386" - use it directly
    let priceRange = 'N/A';
    if (nseIPO.issuePrice && typeof nseIPO.issuePrice === 'string') {
        // Replace "Rs." with "₹" for consistency
        priceRange = nseIPO.issuePrice.replace(/Rs\./g, '₹');
    } else if (nseIPO.issuePriceFrom || nseIPO.issuePriceTo) {
        const from = nseIPO.issuePriceFrom || nseIPO.issuePriceTo;
        const to = nseIPO.issuePriceTo || nseIPO.issuePriceFrom;
        priceRange = from === to ? `₹${to}` : `₹${from} - ₹${to}`;
    }
    
    // Calculate issue size in ₹ Cr (issueSize is in shares, multiply by upper price)
    let issueSize = 'N/A';
    if (nseIPO.issueSize && nseIPO.issuePrice) {
        const shares = parseFloat(String(nseIPO.issueSize));
        // Extract the upper price from "Rs.367 to Rs.386"
        const priceMatch = String(nseIPO.issuePrice).match(/(\d+(?:\.\d+)?)\s*$/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        if (shares && price) {
            const totalValue = shares * price;
            issueSize = formatCurrency(totalValue);
        }
    }
    
    const listingPrice = nseIPO.listingOpenPrice || nseIPO.listingPrice;
    const issueHighPrice = parseFloat(String(nseIPO.issuePriceTo || nseIPO.issuePrice || 0).replace(/[^0-9.]/g, ''));
    let listingGain: string | undefined;
    
    if (listingPrice && issueHighPrice) {
        const gainPercent = ((listingPrice - issueHighPrice) / issueHighPrice) * 100;
        listingGain = gainPercent >= 0 ? `+${gainPercent.toFixed(2)}%` : `${gainPercent.toFixed(2)}%`;
    }

    // Determine category from series
    const isSME = nseIPO.series === 'SM' || nseIPO.series === 'SME' || nseIPO.isBse === '1';

    return {
        id: `ipo-${nseIPO.symbol || nseIPO.companyName?.replace(/\s+/g, '-').toLowerCase() || Date.now()}`,
        companyName: nseIPO.companyName || nseIPO.name || 'Unknown',
        symbol: nseIPO.symbol ? `${nseIPO.symbol}.NS` : undefined,
        priceRange: priceRange,
        lotSize: nseIPO.minBidQuantity || nseIPO.lotSize || nseIPO.minimumLotSize || 0,
        issueSize: issueSize,
        openDate: nseIPO.issueStartDate || nseIPO.openDate || '',
        closeDate: nseIPO.issueEndDate || nseIPO.closeDate || '',
        listingDate: nseIPO.listingDate,
        listingPrice: listingPrice,
        listingGain: listingGain,
        status: status,
        category: isSME ? 'SME' : 'Mainboard',
        exchange: isSME ? 'NSE SME' : 'NSE'
    };
}

export async function GET(request: Request) {
    try {
        const now = Date.now();
        
        // Return cached data if still valid (cache for 10 minutes)
        if (ipoCache && now < ipoCache.expiry) {
            return NextResponse.json(ipoCache.data);
        }

        let currentIPOs: IPO[] = [];
        let upcomingIPOs: IPO[] = [];

        // Fetch current/open IPOs from NSE
        try {
            const currentData = await fetchNSEData('/api/ipo-current-issue');
            console.log('NSE Current IPOs:', JSON.stringify(currentData, null, 2));
            
            if (currentData && Array.isArray(currentData)) {
                currentIPOs = currentData.map((ipo: any) => {
                    // Determine if IPO is open or upcoming based on dates
                    const today = new Date();
                    const openDate = new Date(ipo.issueStartDate || ipo.openDate);
                    const closeDate = new Date(ipo.issueEndDate || ipo.closeDate);
                    
                    let status: 'upcoming' | 'open' | 'listed' = 'open';
                    if (openDate > today) {
                        status = 'upcoming';
                    } else if (closeDate < today) {
                        status = 'listed';
                    }
                    
                    return parseNSEIPO(ipo, status);
                });
            }
        } catch (error) {
            console.error('Error fetching current IPOs:', error);
        }

        // Separate current IPOs into open and upcoming
        const openIPOs = currentIPOs.filter(ipo => ipo.status === 'open');
        upcomingIPOs = currentIPOs.filter(ipo => ipo.status === 'upcoming');

        // Note: NSE doesn't have a working past-issues endpoint, so recentlyListed will be empty
        // In the future, we could scrape from other sources or maintain our own database

        const responseData = {
            success: true,
            source: (openIPOs.length > 0 || upcomingIPOs.length > 0) ? 'NSE India' : 'No data available',
            data: {
                upcoming: upcomingIPOs,
                open: openIPOs,
                recentlyListed: [] as IPO[]
            },
            totalIPOs: {
                upcoming: upcomingIPOs.length,
                open: openIPOs.length,
                recentlyListed: 0
            },
            lastUpdated: new Date().toISOString()
        };

        // Cache the response
        ipoCache = {
            data: responseData,
            expiry: now + 10 * 60 * 1000 // 10 minutes cache
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('IPO API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            data: {
                upcoming: [],
                open: [],
                recentlyListed: []
            }
        }, { status: 500 });
    }
}
