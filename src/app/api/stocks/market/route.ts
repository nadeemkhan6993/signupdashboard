import { NextResponse } from 'next/server';
import { getTopGainers, getTopLosers, getMarketIndices } from '@/helpers/nseHelper';
import { getSensexData } from '@/helpers/bseHelper';

// Indian stock market indices and their mock data (fallback)
// Using realistic values for demonstration
const MARKET_DATA = {
    indices: [
        { 
            symbol: 'NIFTY50', 
            name: 'NIFTY 50', 
            value: 22147.50, 
            change: 156.30, 
            changePercent: '+0.71%',
            high: 22198.45,
            low: 21987.20
        },
        { 
            symbol: 'SENSEX', 
            name: 'BSE SENSEX', 
            value: 72831.94, 
            change: 535.24, 
            changePercent: '+0.74%',
            high: 72956.78,
            low: 72289.45
        },
        { 
            symbol: 'BANKNIFTY', 
            name: 'BANK NIFTY', 
            value: 47256.80, 
            change: -123.45, 
            changePercent: '-0.26%',
            high: 47456.30,
            low: 47123.15
        },
        { 
            symbol: 'NIFTYIT', 
            name: 'NIFTY IT', 
            value: 38456.75, 
            change: 289.60, 
            changePercent: '+0.76%',
            high: 38567.90,
            low: 38234.50
        },
    ],
    topGainers: [
        { symbol: 'TATAPOWER.NS', name: 'Tata Power', price: 425.60, change: 18.45, changePercent: '+4.53%' },
        { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', price: 2856.30, change: 98.70, changePercent: '+3.58%' },
        { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', price: 1156.80, change: 34.25, changePercent: '+3.05%' },
        { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', price: 987.45, change: 25.60, changePercent: '+2.66%' },
        { symbol: 'HCLTECH.NS', name: 'HCL Technologies', price: 1678.90, change: 38.90, changePercent: '+2.37%' },
    ],
    topLosers: [
        { symbol: 'DRREDDY.NS', name: "Dr. Reddy's Labs", price: 5234.50, change: -156.80, changePercent: '-2.91%' },
        { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', price: 1456.70, change: -38.90, changePercent: '-2.60%' },
        { symbol: 'CIPLA.NS', name: 'Cipla', price: 1234.80, change: -28.45, changePercent: '-2.25%' },
        { symbol: 'AXISBANK.NS', name: 'Axis Bank', price: 1067.30, change: -21.30, changePercent: '-1.96%' },
        { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', price: 10234.60, change: -178.50, changePercent: '-1.71%' },
    ],
    sectorPerformance: [
        { sector: 'IT', change: '+1.24%', color: '#22c55e' },
        { sector: 'Banking', change: '+0.89%', color: '#22c55e' },
        { sector: 'Energy', change: '+0.67%', color: '#22c55e' },
        { sector: 'FMCG', change: '+0.45%', color: '#22c55e' },
        { sector: 'Pharma', change: '-0.78%', color: '#ef4444' },
        { sector: 'Auto', change: '-0.34%', color: '#ef4444' },
        { sector: 'Realty', change: '+2.15%', color: '#22c55e' },
        { sector: 'Metal', change: '+1.06%', color: '#22c55e' },
    ],
    marketStats: {
        advancers: 1234,
        decliners: 876,
        unchanged: 145,
        totalTurnover: '₹78,456 Cr',
        marketCap: '₹345.67 Lakh Cr',
        vix: 13.45,
        fiiActivity: '+₹2,345 Cr',
        diiActivity: '+₹1,567 Cr'
    }
};

// Add some randomness to make it feel real-time
function addVariation(value: number, percentRange: number = 0.5): number {
    const variation = (Math.random() - 0.5) * 2 * (value * percentRange / 100);
    return parseFloat((value + variation).toFixed(2));
}

export async function GET() {
    try {
        // Try to get live data from NSE and BSE
        let liveGainers: any[] = [];
        let liveLosers: any[] = [];
        let liveIndices: any[] = [];
        let dataSource = 'mock';

        try {
            const [gainersData, losersData, indicesData, sensexData] = await Promise.all([
                getTopGainers(),
                getTopLosers(),
                getMarketIndices(),
                getSensexData()
            ]);
            
            if (gainersData.length > 0) {
                liveGainers = gainersData.map(stock => ({
                    symbol: stock.symbol,
                    name: stock.name,
                    price: stock.lastPrice || 0,
                    change: stock.change || 0,
                    changePercent: stock.pChange ? `${stock.pChange > 0 ? '+' : ''}${stock.pChange.toFixed(2)}%` : '0%'
                }));
                dataSource = 'NSE';
            }
            
            if (losersData.length > 0) {
                liveLosers = losersData.map(stock => ({
                    symbol: stock.symbol,
                    name: stock.name,
                    price: stock.lastPrice || 0,
                    change: stock.change || 0,
                    changePercent: stock.pChange ? `${stock.pChange > 0 ? '+' : ''}${stock.pChange.toFixed(2)}%` : '0%'
                }));
            }

            // Parse live indices data
            if (indicesData && indicesData.data) {
                const indexMap: { [key: string]: string } = {
                    'NIFTY 50': 'NIFTY50',
                    'NIFTY BANK': 'BANKNIFTY',
                    'NIFTY IT': 'NIFTYIT',
                    'NIFTY NEXT 50': 'NIFTYNEXT50',
                    'NIFTY MIDCAP 50': 'NIFTYMIDCAP',
                    'NIFTY SMLCAP 50': 'NIFTYSMLCAP'
                };
                
                liveIndices = indicesData.data
                    .filter((idx: any) => ['NIFTY 50', 'NIFTY BANK', 'NIFTY IT', 'NIFTY NEXT 50'].includes(idx.index))
                    .map((idx: any) => ({
                        symbol: indexMap[idx.index] || idx.index.replace(/\s+/g, ''),
                        name: idx.index,
                        value: idx.last,
                        change: idx.change || (idx.last - idx.previousClose),
                        changePercent: idx.percentChange ? `${idx.percentChange > 0 ? '+' : ''}${idx.percentChange.toFixed(2)}%` : '0%',
                        high: idx.high,
                        low: idx.low
                    }));
                
                // Add SENSEX from BSE (Yahoo Finance API)
                if (sensexData) {
                    const sensexEntry = {
                        symbol: 'SENSEX',
                        name: 'S&P BSE SENSEX',
                        value: sensexData.value,
                        change: sensexData.change,
                        changePercent: sensexData.changePercent,
                        high: sensexData.high,
                        low: sensexData.low
                    };
                    
                    // Insert SENSEX after NIFTY 50
                    const nifty50Index = liveIndices.findIndex(i => i.symbol === 'NIFTY50');
                    if (nifty50Index !== -1) {
                        liveIndices.splice(nifty50Index + 1, 0, sensexEntry);
                    } else {
                        liveIndices.unshift(sensexEntry);
                    }
                    dataSource = 'NSE+BSE';
                } else {
                    dataSource = 'NSE';
                }
            }
        } catch (nseError) {
            console.log('NSE API unavailable for market data, using mock data');
        }

        // Add slight variations to simulate real-time updates
        const dynamicData = {
            ...MARKET_DATA,
            indices: liveIndices.length > 0 ? liveIndices : MARKET_DATA.indices.map(index => ({
                ...index,
                value: addVariation(index.value, 0.1),
                change: addVariation(index.change, 5),
            })),
            topGainers: liveGainers.length > 0 ? liveGainers : MARKET_DATA.topGainers.map(stock => ({
                ...stock,
                price: addVariation(stock.price, 0.2),
            })),
            topLosers: liveLosers.length > 0 ? liveLosers : MARKET_DATA.topLosers.map(stock => ({
                ...stock,
                price: addVariation(stock.price, 0.2),
            })),
            marketStats: {
                ...MARKET_DATA.marketStats,
                vix: addVariation(MARKET_DATA.marketStats.vix, 2),
            },
            lastUpdated: new Date().toISOString(),
            marketStatus: isMarketOpen() ? 'OPEN' : 'CLOSED',
            dataSource: dataSource
        };

        return NextResponse.json({
            success: true,
            data: dynamicData
        });

    } catch (error: any) {
        console.error('Market Overview API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

function isMarketOpen(): boolean {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    
    const day = istTime.getUTCDay();
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    // Market hours: 9:15 AM to 3:30 PM IST, Monday to Friday
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM
    
    return day >= 1 && day <= 5 && timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}
