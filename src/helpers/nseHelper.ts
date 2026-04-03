// NSE India API Helper
// Fetches real-time stock data from NSE India

const NSE_BASE_URL = 'https://www.nseindia.com';

// Required headers to access NSE API
const getHeaders = (cookie?: string) => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.nseindia.com/',
    'Connection': 'keep-alive',
    ...(cookie && { 'Cookie': cookie })
});

// Cache for cookies and stock data
let cachedCookies: string | null = null;
let cookieExpiry: number = 0;
let cachedStocks: StockData[] | null = null;
let stockCacheExpiry: number = 0;

// Long-lived cache for the NSE equity master list (changes rarely)
let cachedMasterStocks: StockData[] | null = null;
let masterCacheExpiry: number = 0;

interface StockData {
    symbol: string;
    name: string;
    series?: string;
    lastPrice?: number;
    change?: number;
    pChange?: number;
    open?: number;
    high?: number;
    low?: number;
    previousClose?: number;
    totalTradedVolume?: number;
    sector?: string;
}

// Get cookies from NSE website
async function getCookies(): Promise<string> {
    const now = Date.now();
    if (cachedCookies && now < cookieExpiry) {
        return cachedCookies;
    }

    try {
        const response = await fetch(NSE_BASE_URL, {
            method: 'GET',
            headers: getHeaders(),
            signal: AbortSignal.timeout(5000), // 5 s — just getting cookies
        });
        
        const cookies = response.headers.get('set-cookie') || '';
        cachedCookies = cookies;
        cookieExpiry = now + 5 * 60 * 1000; // 5 minutes cache
        return cookies;
    } catch (error) {
        console.error('Failed to get NSE cookies:', error);
        return '';
    }
}

// Fetch data from NSE API
async function fetchNSEData(endpoint: string): Promise<any> {
    const cookies = await getCookies();
    
    const response = await fetch(`${NSE_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(cookies),
        next: { revalidate: 60 }, // Cache for 60 seconds
        signal: AbortSignal.timeout(8000), // 8 s hard timeout per request
    });

    if (!response.ok) {
        throw new Error(`NSE API error: ${response.status}`);
    }

    return response.json();
}

// Fetch ALL NSE-listed equities from the public NSE equity master CSV.
// URL: https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv
// This file is publicly accessible (no cookie required) and covers every
// security listed on NSE — including stocks not part of any Nifty index.
async function fetchNSEEquityMaster(): Promise<StockData[]> {
    const now = Date.now();
    if (cachedMasterStocks && now < masterCacheExpiry) {
        return cachedMasterStocks;
    }

    const csvUrl = 'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv';
    const response = await fetch(csvUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://www.nseindia.com/',
        },
        // Cache response at fetch level for 24 hours
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(15000), // 15 s — CSV can be a few hundred KB
    });

    if (!response.ok) {
        throw new Error(`NSE equity master CSV fetch failed: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    const stocks: StockData[] = [];

    // CSV format: SYMBOL,NAME OF COMPANY,SERIES,DATE OF LISTING,PAID UP VALUE,MARKET LOT,ISIN NUMBER,FACE VALUE
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');
        if (cols.length < 3) continue;

        const symbol = cols[0].trim().replace(/^"|"$/g, '');
        // Company name is everything between col[1] and the 6th-from-last column
        // to handle any rare commas in names
        const series = cols[cols.length - 6]?.trim().replace(/^"|"$/g, '') || cols[2]?.trim().replace(/^"|"$/g, '');
        const name = cols.slice(1, cols.length - 6).join(',').trim().replace(/^"|"$/g, '') || cols[1]?.trim().replace(/^"|"$/g, '');

        if (!symbol || !name) continue;

        // EQ  = regular equity (main board)
        // BE  = trade-to-trade (book entry) equity
        // BL  = block deal
        // SM/ST = NSE SME (small & medium enterprise)
        // N1–N8 = debt/structured products — skip those
        const validSeries = ['EQ', 'BE', 'BL', 'SM', 'ST'];
        if (!validSeries.includes(series)) continue;

        stocks.push({ symbol: `${symbol}.NS`, name, series });
    }

    cachedMasterStocks = stocks;
    masterCacheExpiry = now + 24 * 60 * 60 * 1000; // 24 hours

    return stocks;
}

// Get all equity stocks
export async function getAllStocks(): Promise<StockData[]> {
    const now = Date.now();

    // Return cached data if still valid (5 minutes)
    if (cachedStocks && now < stockCacheExpiry) {
        return cachedStocks;
    }

    // ── Step 1: Fetch comprehensive master list from NSE equity CSV ────────────
    // Covers all ~2,200+ NSE-listed equities, not just index members.
    let masterStocks: StockData[] = [];
    try {
        masterStocks = await fetchNSEEquityMaster();
    } catch (masterErr) {
        console.log('NSE equity master CSV unavailable, falling back to index-only data');
    }

    // ── Step 2: Fetch live price data from NSE index endpoints ────────────────
    // Covers ~750 index-constituent stocks with real-time prices.
    try {
        const endpoints = [
            '/api/equity-stockIndices?index=NIFTY%2050',
            '/api/equity-stockIndices?index=NIFTY%20NEXT%2050',
            '/api/equity-stockIndices?index=NIFTY%20100',
            '/api/equity-stockIndices?index=NIFTY%20200',
            '/api/equity-stockIndices?index=NIFTY%20500',
            '/api/equity-stockIndices?index=NIFTY%20MIDCAP%2050',
            '/api/equity-stockIndices?index=NIFTY%20MIDCAP%20100',
            '/api/equity-stockIndices?index=NIFTY%20SMALLCAP%2050',
            '/api/equity-stockIndices?index=NIFTY%20SMALLCAP%20100',
            '/api/equity-stockIndices?index=NIFTY%20SMALLCAP%20250',
            '/api/equity-stockIndices?index=NIFTY%20MICROCAP%20250',
            '/api/equity-stockIndices?index=NIFTY%20BANK',
            '/api/equity-stockIndices?index=NIFTY%20IT',
            '/api/equity-stockIndices?index=NIFTY%20PHARMA',
            '/api/equity-stockIndices?index=NIFTY%20AUTO',
            '/api/equity-stockIndices?index=NIFTY%20METAL',
            '/api/equity-stockIndices?index=NIFTY%20REALTY',
            '/api/equity-stockIndices?index=NIFTY%20ENERGY',
            '/api/equity-stockIndices?index=NIFTY%20INFRA',
            '/api/equity-stockIndices?index=NIFTY%20PSE',
            '/api/equity-stockIndices?index=NIFTY%20MEDIA',
            '/api/equity-stockIndices?index=NIFTY%20FMCG',
            '/api/equity-stockIndices?index=NIFTY%20FINANCIAL%20SERVICES',
            '/api/equity-stockIndices?index=NIFTY%20PRIVATE%20BANK',
            '/api/equity-stockIndices?index=NIFTY%20PSU%20BANK',
            '/api/equity-stockIndices?index=NIFTY%20OIL%20%26%20GAS',
            '/api/equity-stockIndices?index=NIFTY%20CONSUMER%20DURABLES',
            '/api/equity-stockIndices?index=NIFTY%20HEALTHCARE%20INDEX',
            '/api/equity-stockIndices?index=NIFTY%20COMMODITIES',
            '/api/equity-stockIndices?index=NIFTY%20CPSE',
            '/api/equity-stockIndices?index=NIFTY%20GROWSECT%2015',
            '/api/equity-stockIndices?index=NIFTY%20TOTAL%20MARKET',
            '/api/equity-stockIndices?index=NIFTY%20LARGEMIDCAP%20250',
            '/api/equity-stockIndices?index=NIFTY%20MIDSMALLCAP%20400',
            '/api/equity-stockIndices?index=NIFTY%20INDIA%20DEFENCE',
            '/api/equity-stockIndices?index=NIFTY%20INDIA%20DIGITAL',
            '/api/equity-stockIndices?index=NIFTY%20INDIA%20MANUFACTURING',
            '/api/equity-stockIndices?index=NIFTY%20MOBILITY',
            '/api/equity-stockIndices?index=NIFTY%20NON-CYCLICAL%20CONSUMER',
            '/api/equity-stockIndices?index=NIFTY%20HOUSING',
            '/api/equity-stockIndices?index=NIFTY%20TRANSPORTATION%20%26%20LOGISTICS'
        ];

        const results = await Promise.all(
            endpoints.map(endpoint =>
                fetchNSEData(endpoint).catch(() => ({ data: [] }))
            )
        );

        const allData = results.flatMap(result => result.data || []);

        // Build a map of live price data keyed by clean symbol
        const liveDataMap = new Map<string, StockData>();
        allData.forEach((stock: any) => {
            if (stock.symbol && !stock.symbol.includes('NIFTY') && !stock.symbol.includes('INDEX')) {
                liveDataMap.set(stock.symbol, {
                    symbol: `${stock.symbol}.NS`,
                    name: stock.companyName || stock.symbol,
                    series: stock.series,
                    lastPrice: stock.lastPrice,
                    change: stock.change,
                    pChange: stock.pChange,
                    open: stock.open,
                    high: stock.dayHigh,
                    low: stock.dayLow,
                    previousClose: stock.previousClose,
                    totalTradedVolume: stock.totalTradedVolume,
                });
            }
        });

        // ── Step 3: Merge ──────────────────────────────────────────────────────
        // Start with the full master list (provides complete symbol+name coverage).
        // Then overlay live price data (adds prices, may refine company names).
        const stockMap = new Map<string, StockData>();

        masterStocks.forEach(stock => stockMap.set(stock.symbol, stock));

        liveDataMap.forEach((liveStock, cleanSymbol) => {
            const nsSymbol = `${cleanSymbol}.NS`;
            const existing = stockMap.get(nsSymbol);
            stockMap.set(nsSymbol, { ...existing, ...liveStock });
        });

        const stocks = Array.from(stockMap.values()).sort((a, b) =>
            a.symbol.localeCompare(b.symbol)
        );

        cachedStocks = stocks;
        stockCacheExpiry = now + 5 * 60 * 1000; // 5 minutes

        return stocks;
    } catch (error) {
        console.error('Failed to fetch stock index data from NSE:', error);

        // If master list was fetched, return it even without live prices
        if (masterStocks.length > 0) {
            const sorted = masterStocks.sort((a, b) => a.symbol.localeCompare(b.symbol));
            cachedStocks = sorted;
            stockCacheExpiry = now + 5 * 60 * 1000;
            return sorted;
        }

        if (cachedStocks) return cachedStocks;
        throw error;
    }
}

// Get stock quote by symbol
export async function getStockQuote(symbol: string): Promise<StockData | null> {
    try {
        // Remove .NS suffix if present
        const cleanSymbol = symbol.replace('.NS', '');
        const data = await fetchNSEData(`/api/quote-equity?symbol=${encodeURIComponent(cleanSymbol)}`);
        
        if (data && data.priceInfo) {
            return {
                symbol: `${cleanSymbol}.NS`,
                name: data.info?.companyName || cleanSymbol,
                lastPrice: data.priceInfo.lastPrice,
                change: data.priceInfo.change,
                pChange: data.priceInfo.pChange,
                open: data.priceInfo.open,
                high: data.priceInfo.intraDayHighLow?.max,
                low: data.priceInfo.intraDayHighLow?.min,
                previousClose: data.priceInfo.previousClose,
                totalTradedVolume: data.preOpenMarket?.totalTurnover
            };
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return null;
    }
}

// Get market indices
export async function getMarketIndices(): Promise<any> {
    try {
        const data = await fetchNSEData('/api/allIndices');
        return data;
    } catch (error) {
        console.error('Failed to fetch market indices:', error);
        throw error;
    }
}

// Get top gainers
export async function getTopGainers(): Promise<StockData[]> {
    try {
        const data = await fetchNSEData('/api/live-analysis-variations?index=gainers');
        return (data.NIFTY?.data || []).slice(0, 10).map((stock: any) => {
            const lastPrice = stock.ltp || 0;
            const pChange = stock.perChange || 0;
            // Calculate change from percentage: change = (price * pChange) / (100 + pChange)
            const calculatedChange = pChange !== 0 ? (lastPrice * pChange) / (100 + pChange) : 0;
            return {
                symbol: `${stock.symbol}.NS`,
                name: stock.symbol,
                lastPrice: lastPrice,
                change: stock.netPrice || calculatedChange,
                pChange: pChange
            };
        });
    } catch (error) {
        console.error('Failed to fetch top gainers:', error);
        return [];
    }
}

// Get top losers
export async function getTopLosers(): Promise<StockData[]> {
    try {
        const data = await fetchNSEData('/api/live-analysis-variations?index=losers');
        return (data.NIFTY?.data || []).slice(0, 10).map((stock: any) => {
            const lastPrice = stock.ltp || 0;
            const pChange = stock.perChange || 0;
            // Calculate change from percentage: change = (price * pChange) / (100 + pChange)
            const calculatedChange = pChange !== 0 ? (lastPrice * pChange) / (100 + pChange) : 0;
            return {
                symbol: `${stock.symbol}.NS`,
                name: stock.symbol,
                lastPrice: lastPrice,
                change: stock.netPrice || calculatedChange,
                pChange: pChange
            };
        });
    } catch (error) {
        console.error('Failed to fetch top losers:', error);
        return [];
    }
}

// Search stocks by name or symbol
export async function searchStocks(query: string): Promise<StockData[]> {
    const allStocks = await getAllStocks();
    const lowerQuery = query.toLowerCase();
    
    return allStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(lowerQuery) ||
        stock.name.toLowerCase().includes(lowerQuery)
    );
}

export default {
    getAllStocks,
    getStockQuote,
    getMarketIndices,
    getTopGainers,
    getTopLosers,
    searchStocks
};
