import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote } from '@/helpers/nseHelper';
import { getBSEStockQuote } from '@/helpers/bseHelper';

// Get stock quote from NSE or BSE based on exchange parameter
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const exchange = searchParams.get('exchange')?.toUpperCase() || 'NSE';

        if (!symbol) {
            return NextResponse.json({
                success: false,
                error: 'Symbol is required'
            }, { status: 400 });
        }

        // Clean the symbol (remove any existing suffix)
        const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, '').toUpperCase();

        if (exchange === 'BSE') {
            // Fetch from BSE (Yahoo Finance .BO)
            const bseData = await getBSEStockQuote(cleanSymbol);
            
            if (bseData) {
                return NextResponse.json({
                    success: true,
                    exchange: 'BSE',
                    stock: {
                        symbol: bseData.symbol,
                        name: bseData.name,
                        exchange: 'BSE',
                        price: bseData.lastPrice,
                        change: bseData.change,
                        changePercent: `${bseData.pChange >= 0 ? '+' : ''}${bseData.pChange.toFixed(2)}%`,
                        pChange: bseData.pChange,
                        open: bseData.open,
                        high: bseData.high,
                        low: bseData.low,
                        previousClose: bseData.previousClose,
                        volume: bseData.volume,
                        weekHigh52: bseData.weekHigh52,
                        weekLow52: bseData.weekLow52
                    }
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: `Stock ${cleanSymbol} not found on BSE`
                }, { status: 404 });
            }
        } else {
            // Fetch from NSE
            const nseData = await getStockQuote(cleanSymbol);
            
            if (nseData) {
                return NextResponse.json({
                    success: true,
                    exchange: 'NSE',
                    stock: {
                        symbol: nseData.symbol,
                        name: nseData.name,
                        exchange: 'NSE',
                        price: nseData.lastPrice,
                        change: nseData.change,
                        changePercent: `${nseData.pChange && nseData.pChange >= 0 ? '+' : ''}${nseData.pChange?.toFixed(2) || 0}%`,
                        pChange: nseData.pChange,
                        open: nseData.open,
                        high: nseData.high,
                        low: nseData.low,
                        previousClose: nseData.previousClose,
                        volume: nseData.totalTradedVolume
                    }
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: `Stock ${cleanSymbol} not found on NSE`
                }, { status: 404 });
            }
        }
    } catch (error: any) {
        console.error('Exchange API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
