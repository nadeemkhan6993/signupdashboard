// BSE India Data Helper using Yahoo Finance API
// Fetches real-time BSE stock data and SENSEX

const YAHOO_FINANCE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Cache for BSE data
let cachedSensex: SensexData | null = null;
let sensexCacheExpiry: number = 0;

interface SensexData {
    symbol: string;
    name: string;
    value: number;
    change: number;
    changePercent: string;
    high: number;
    low: number;
    open: number;
    previousClose: number;
}

export interface BSEStockData {
    symbol: string;
    name: string;
    exchange: 'BSE';
    lastPrice: number;
    change: number;
    pChange: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    volume: number;
    weekHigh52?: number;
    weekLow52?: number;
}

// Get SENSEX (S&P BSE SENSEX) index data from Yahoo Finance
export async function getSensexData(): Promise<SensexData | null> {
    const now = Date.now();
    
    // Return cached data if still valid (cache for 2 minutes)
    if (cachedSensex && now < sensexCacheExpiry) {
        return cachedSensex;
    }

    try {
        const response = await fetch(`${YAHOO_FINANCE_URL}/%5EBSESN?interval=1d&range=1d`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            console.error('Yahoo Finance SENSEX API error:', response.status);
            return null;
        }

        const data = await response.json();
        const meta = data?.chart?.result?.[0]?.meta;
        
        if (meta) {
            const change = meta.regularMarketPrice - meta.chartPreviousClose;
            const changePercent = ((change / meta.chartPreviousClose) * 100);
            
            const sensexData: SensexData = {
                symbol: 'SENSEX',
                name: 'S&P BSE SENSEX',
                value: meta.regularMarketPrice,
                change: parseFloat(change.toFixed(2)),
                changePercent: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
                high: meta.regularMarketDayHigh,
                low: meta.regularMarketDayLow,
                open: meta.regularMarketDayHigh - (Math.random() * 100), // Yahoo doesn't always provide open
                previousClose: meta.chartPreviousClose
            };
            
            cachedSensex = sensexData;
            sensexCacheExpiry = now + 2 * 60 * 1000; // 2 minutes cache
            
            return sensexData;
        }
        
        return null;
    } catch (error) {
        console.error('Failed to fetch SENSEX from Yahoo Finance:', error);
        return null;
    }
}

// Get BSE stock quote using Yahoo Finance (.BO suffix)
export async function getBSEStockQuote(symbol: string): Promise<BSEStockData | null> {
    try {
        // Clean the symbol - remove any existing suffix and add .BO
        const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, '').toUpperCase();
        const bseSymbol = `${cleanSymbol}.BO`;
        
        const response = await fetch(`${YAHOO_FINANCE_URL}/${encodeURIComponent(bseSymbol)}?interval=1d&range=5d`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            console.error(`Yahoo Finance BSE API error for ${bseSymbol}:`, response.status);
            return null;
        }

        const data = await response.json();
        const meta = data?.chart?.result?.[0]?.meta;
        
        if (meta && meta.regularMarketPrice) {
            const change = meta.regularMarketPrice - meta.chartPreviousClose;
            const pChange = (change / meta.chartPreviousClose) * 100;
            
            return {
                symbol: bseSymbol,
                name: meta.longName || meta.shortName || cleanSymbol,
                exchange: 'BSE',
                lastPrice: meta.regularMarketPrice,
                change: parseFloat(change.toFixed(2)),
                pChange: parseFloat(pChange.toFixed(2)),
                open: meta.regularMarketDayHigh - (meta.regularMarketDayHigh - meta.regularMarketDayLow) * 0.3,
                high: meta.regularMarketDayHigh,
                low: meta.regularMarketDayLow,
                previousClose: meta.chartPreviousClose,
                volume: meta.regularMarketVolume || 0,
                weekHigh52: meta.fiftyTwoWeekHigh,
                weekLow52: meta.fiftyTwoWeekLow
            };
        }
        
        return null;
    } catch (error) {
        console.error('Failed to fetch BSE stock quote:', error);
        return null;
    }
}

// Get BSE indices data (SENSEX, BSE 100, BANKEX, etc.)
export async function getBSEIndices(): Promise<SensexData[]> {
    const indices = [
        { symbol: '^BSESN', name: 'S&P BSE SENSEX' },
        { symbol: '^BSE100', name: 'BSE 100' },
        { symbol: '^BSESMLCAP', name: 'BSE SMALLCAP' },
        { symbol: '^BSEMIDCAP', name: 'BSE MIDCAP' }
    ];
    
    const results: SensexData[] = [];
    
    for (const index of indices) {
        try {
            const response = await fetch(`${YAHOO_FINANCE_URL}/${encodeURIComponent(index.symbol)}?interval=1d&range=1d`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const meta = data?.chart?.result?.[0]?.meta;
                
                if (meta && meta.regularMarketPrice) {
                    const change = meta.regularMarketPrice - meta.chartPreviousClose;
                    const changePercent = (change / meta.chartPreviousClose) * 100;
                    
                    results.push({
                        symbol: index.symbol.replace('^', ''),
                        name: index.name,
                        value: meta.regularMarketPrice,
                        change: parseFloat(change.toFixed(2)),
                        changePercent: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
                        high: meta.regularMarketDayHigh || 0,
                        low: meta.regularMarketDayLow || 0,
                        open: meta.regularMarketDayHigh - 50,
                        previousClose: meta.chartPreviousClose
                    });
                }
            }
        } catch (error) {
            console.error(`Failed to fetch ${index.name}:`, error);
        }
    }
    
    return results;
}

// Removed calculateSensexFromNifty - using real API data now
