import { NextResponse } from 'next/server';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const interval = searchParams.get('interval') || 'daily'; // daily, weekly, monthly
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

        if (!symbol) {
            return NextResponse.json({
                success: false,
                error: 'Symbol is required'
            }, { status: 400 });
        }

        let functionName = 'TIME_SERIES_DAILY';
        let timeSeriesKey = 'Time Series (Daily)';

        if (interval === 'weekly') {
            functionName = 'TIME_SERIES_WEEKLY';
            timeSeriesKey = 'Weekly Time Series';
        } else if (interval === 'monthly') {
            functionName = 'TIME_SERIES_MONTHLY';
            timeSeriesKey = 'Monthly Time Series';
        }

        const url = `${ALPHA_VANTAGE_BASE_URL}?function=${functionName}&symbol=${symbol}&apikey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data['Error Message'] || data['Note']) {
            return NextResponse.json({
                success: false,
                error: data['Error Message'] || 'API rate limit exceeded. Please try again later.'
            }, { status: 429 });
        }

        const timeSeries = data[timeSeriesKey];

        if (!timeSeries) {
            return NextResponse.json({
                success: false,
                error: 'No historical data available'
            }, { status: 404 });
        }

        // Convert to array format and limit to last 30 data points
        const chartData = Object.entries(timeSeries)
            .slice(0, 30)
            .reverse()
            .map(([date, values]: [string, any]) => ({
                date,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume'])
            }));

        return NextResponse.json({
            success: true,
            symbol,
            interval,
            data: chartData
        });

    } catch (error: any) {
        console.error('Historical Data API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
