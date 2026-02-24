'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface StockDetail {
    symbol: string;
    name: string;
    sector: string;
    price: number;
    change: number;
    changePercent: string;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    volume: number;
    latestTradingDay: string;
    weekHigh52: number;
    weekLow52: number;
    marketCap: string;
    pe: number;
    eps: number;
    dividend: string;
}

// Generate stable random data based on seed
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateStableIntraday(baseValue: number, seed: number): number[] {
    const data: number[] = [];
    let current = baseValue * 0.998;
    for (let i = 0; i < 8; i++) {
        current = current + (seededRandom(seed + i) - 0.45) * (baseValue * 0.003);
        data.push(parseFloat(current.toFixed(2)));
    }
    return data;
}

function generateWeeklyData(baseValue: number, seed: number): number[] {
    return Array.from({ length: 5 }, (_, i) => 
        parseFloat((baseValue * (0.97 + seededRandom(seed + i + 100) * 0.06)).toFixed(2))
    );
}

function generateMonthlyData(baseValue: number, seed: number): number[] {
    return Array.from({ length: 30 }, (_, i) => 
        parseFloat((baseValue * (0.92 + seededRandom(seed + i + 200) * 0.16)).toFixed(2))
    );
}

function generateVolumeData(baseVolume: number, seed: number): number[] {
    return Array.from({ length: 8 }, (_, i) => 
        Math.floor(baseVolume / 8 * (0.5 + seededRandom(seed + i + 300)))
    );
}

interface Expert {
    id: string;
    name: string;
    email: string;
    designation: string;
}

export default function StockDetailPage() {
    const params = useParams();
    const symbol = decodeURIComponent(params.symbol as string);
    
    const [stock, setStock] = useState<StockDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'1D' | '1W' | '1M'>('1D');
    const [expert, setExpert] = useState<Expert | null>(null);
    const [exchange, setExchange] = useState<'NSE' | 'BSE'>('NSE');
    const [exchangeLoading, setExchangeLoading] = useState(false);

    useEffect(() => {
        fetchStockDetails();
        fetchExpert();
    }, [symbol, exchange]);

    const fetchExpert = async () => {
        try {
            const res = await fetch('/api/expert/me');
            const data = await res.json();
            if (data.success && data.expert) {
                setExpert(data.expert);
            }
        } catch (error) {
            // Not logged in
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/expert/logout', { method: 'POST' });
            setExpert(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleExchangeToggle = (newExchange: 'NSE' | 'BSE') => {
        if (newExchange !== exchange) {
            setExchangeLoading(true);
            setExchange(newExchange);
        }
    };

    const fetchStockDetails = async () => {
        setLoading(true);
        try {
            // Extract clean symbol (remove .NS or .BO suffix)
            const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, '');
            
            // Try to fetch from the exchange-specific API first
            const exchangeRes = await fetch(`/api/stocks/exchange?symbol=${encodeURIComponent(cleanSymbol)}&exchange=${exchange}`);
            const exchangeData = await exchangeRes.json();
            
            if (exchangeData.success && exchangeData.stock) {
                const stockInfo = exchangeData.stock;
                const seed = cleanSymbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                
                setStock({
                    symbol: stockInfo.symbol,
                    name: stockInfo.name,
                    sector: stockInfo.sector || 'Unknown',
                    price: stockInfo.price,
                    change: stockInfo.change,
                    changePercent: stockInfo.changePercent,
                    high: stockInfo.high,
                    low: stockInfo.low,
                    open: stockInfo.open,
                    previousClose: stockInfo.previousClose,
                    volume: stockInfo.volume || 0,
                    latestTradingDay: new Date().toISOString().split('T')[0],
                    weekHigh52: stockInfo.weekHigh52 || stockInfo.price * 1.35,
                    weekLow52: stockInfo.weekLow52 || stockInfo.price * 0.7,
                    marketCap: `₹${(stockInfo.price * (100 + seededRandom(seed + 3) * 500)).toFixed(0)}Cr`,
                    pe: parseFloat((15 + seededRandom(seed + 4) * 30).toFixed(2)),
                    eps: parseFloat((stockInfo.price / (20 + seededRandom(seed + 5) * 15)).toFixed(2)),
                    dividend: `${(seededRandom(seed + 6) * 3).toFixed(2)}%`
                });
            } else {
                // Fallback to quote API if exchange API fails
                const res = await fetch('/api/stocks/quote');
                const data = await res.json();
                
                if (data.success) {
                    const stockInfo = data.stocks.find((s: { symbol: string }) => 
                        s.symbol.replace(/\.(NS|BO)$/i, '') === cleanSymbol
                    );
                    
                    if (stockInfo) {
                        const seed = cleanSymbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                        const hasRealPrice = stockInfo.lastPrice && stockInfo.lastPrice > 0;
                        
                        const basePrice = hasRealPrice 
                            ? stockInfo.lastPrice 
                            : 500 + seededRandom(seed) * 3000;
                        
                        const change = hasRealPrice && stockInfo.change
                            ? stockInfo.change
                            : (seededRandom(seed + 1) - 0.5) * (basePrice * 0.03);
                        
                        const pChange = hasRealPrice && stockInfo.pChange !== undefined
                            ? stockInfo.pChange
                            : ((change / basePrice) * 100);
                        
                        const changePercent = `${pChange >= 0 ? '+' : ''}${pChange.toFixed(2)}%`;

                        setStock({
                            symbol: stockInfo.symbol,
                            name: stockInfo.name,
                            sector: stockInfo.sector || 'Unknown',
                            price: parseFloat(basePrice.toFixed(2)),
                            change: parseFloat(change.toFixed(2)),
                            changePercent: changePercent,
                            high: hasRealPrice && stockInfo.dayHigh ? stockInfo.dayHigh : parseFloat((basePrice * 1.025).toFixed(2)),
                            low: hasRealPrice && stockInfo.dayLow ? stockInfo.dayLow : parseFloat((basePrice * 0.975).toFixed(2)),
                            open: hasRealPrice && stockInfo.open ? stockInfo.open : parseFloat((basePrice * 0.998).toFixed(2)),
                            previousClose: hasRealPrice && stockInfo.previousClose ? stockInfo.previousClose : parseFloat((basePrice - change).toFixed(2)),
                            volume: stockInfo.totalTradedVolume || Math.floor(1000000 + seededRandom(seed + 2) * 10000000),
                            latestTradingDay: new Date().toISOString().split('T')[0],
                            weekHigh52: hasRealPrice && stockInfo.yearHigh ? stockInfo.yearHigh : parseFloat((basePrice * 1.35).toFixed(2)),
                            weekLow52: hasRealPrice && stockInfo.yearLow ? stockInfo.yearLow : parseFloat((basePrice * 0.7).toFixed(2)),
                            marketCap: `₹${(basePrice * (100 + seededRandom(seed + 3) * 500)).toFixed(0)}Cr`,
                            pe: parseFloat((15 + seededRandom(seed + 4) * 30).toFixed(2)),
                            eps: parseFloat((basePrice / (20 + seededRandom(seed + 5) * 15)).toFixed(2)),
                            dividend: `${(seededRandom(seed + 6) * 3).toFixed(2)}%`
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching stock details:', error);
        } finally {
            setLoading(false);
            setExchangeLoading(false);
        }
    };

    // Generate seed from symbol for consistent data
    const seed = useMemo(() => 
        symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0), 
    [symbol]);

    // Memoized chart data
    const intradayData = useMemo(() => {
        if (!stock) return null;
        return {
            labels: ['9:15', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '15:30'],
            datasets: [{
                label: 'Price',
                data: generateStableIntraday(stock.price, seed),
                borderColor: stock.change >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                backgroundColor: stock.change >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
            }],
        };
    }, [stock, seed]);

    const weeklyData = useMemo(() => {
        if (!stock) return null;
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
                label: 'Price',
                data: generateWeeklyData(stock.price, seed),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            }],
        };
    }, [stock, seed]);

    const monthlyData = useMemo(() => {
        if (!stock) return null;
        const labels = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.getDate().toString();
        });
        return {
            labels,
            datasets: [{
                label: 'Price',
                data: generateMonthlyData(stock.price, seed),
                borderColor: 'rgb(147, 51, 234)',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                fill: true,
                tension: 0.4,
            }],
        };
    }, [stock, seed]);

    const volumeData = useMemo(() => {
        if (!stock) return null;
        return {
            labels: ['9:15', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '15:30'],
            datasets: [{
                label: 'Volume',
                data: generateVolumeData(stock.volume, seed),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
            }],
        };
    }, [stock, seed]);

    const getActiveChartData = () => {
        switch (activeTab) {
            case '1W': return weeklyData;
            case '1M': return monthlyData;
            default: return intradayData;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading stock data...</p>
                </div>
            </div>
        );
    }

    if (!stock) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Stock not found</h1>
                    <p className="text-gray-400 mb-4">The stock symbol &quot;{symbol}&quot; was not found.</p>
                    <Link href="/" className="text-blue-400 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-gray-400 hover:text-white">
                                ← Back
                            </Link>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold">{stock.name}</h1>
                                    {/* NSE/BSE Toggle Switch */}
                                    <div className="flex items-center bg-gray-700 rounded-lg p-1">
                                        <button
                                            onClick={() => handleExchangeToggle('NSE')}
                                            disabled={exchangeLoading}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                                exchange === 'NSE'
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                                            }`}
                                        >
                                            NSE
                                        </button>
                                        <button
                                            onClick={() => handleExchangeToggle('BSE')}
                                            disabled={exchangeLoading}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                                exchange === 'BSE'
                                                    ? 'bg-orange-600 text-white shadow-md'
                                                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                                            }`}
                                        >
                                            BSE
                                        </button>
                                    </div>
                                    {exchangeLoading && (
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    )}
                                </div>
                                <p className="text-gray-400">{stock.symbol} • {stock.sector} • <span className={exchange === 'NSE' ? 'text-blue-400' : 'text-orange-400'}>{exchange}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold">₹{stock.price.toLocaleString('en-IN')}</p>
                            <p className={`text-lg font-medium ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stock.change >= 0 ? '+' : ''}₹{stock.change.toFixed(2)} ({stock.changePercent})
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Price Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-400">Open</p>
                        <p className="text-lg font-semibold">₹{stock.open.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-400">Previous Close</p>
                        <p className="text-lg font-semibold">₹{stock.previousClose.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-400">Day High</p>
                        <p className="text-lg font-semibold text-green-400">₹{stock.high.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-400">Day Low</p>
                        <p className="text-lg font-semibold text-red-400">₹{stock.low.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-400">52W High</p>
                        <p className="text-lg font-semibold text-green-400">₹{stock.weekHigh52.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4">
                        <p className="text-sm text-gray-400">52W Low</p>
                        <p className="text-lg font-semibold text-red-400">₹{stock.weekLow52.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* Main Chart */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Price Chart</h2>
                        <div className="flex gap-2">
                            {(['1D', '1W', '1M'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                        activeTab === tab
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-80">
                        {getActiveChartData() && (
                            <Line
                                data={getActiveChartData()!}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { 
                                            grid: { color: 'rgba(255,255,255,0.1)' },
                                            ticks: { color: 'rgba(255,255,255,0.6)' }
                                        },
                                        x: { 
                                            grid: { display: false },
                                            ticks: { color: 'rgba(255,255,255,0.6)' }
                                        },
                                    },
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Volume Chart & Key Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Volume Distribution</h2>
                        <div className="h-64">
                            {volumeData && (
                                <Bar
                                    data={volumeData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { 
                                                grid: { color: 'rgba(255,255,255,0.1)' },
                                                ticks: { color: 'rgba(255,255,255,0.6)' }
                                            },
                                            x: { 
                                                grid: { display: false },
                                                ticks: { color: 'rgba(255,255,255,0.6)' }
                                            },
                                        },
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="py-3 border-b border-gray-700">
                                <p className="text-sm text-gray-400">Market Cap</p>
                                <p className="text-lg font-semibold">{stock.marketCap}</p>
                            </div>
                            <div className="py-3 border-b border-gray-700">
                                <p className="text-sm text-gray-400">P/E Ratio</p>
                                <p className="text-lg font-semibold">{stock.pe}</p>
                            </div>
                            <div className="py-3 border-b border-gray-700">
                                <p className="text-sm text-gray-400">EPS</p>
                                <p className="text-lg font-semibold">₹{stock.eps}</p>
                            </div>
                            <div className="py-3 border-b border-gray-700">
                                <p className="text-sm text-gray-400">Dividend Yield</p>
                                <p className="text-lg font-semibold">{stock.dividend}</p>
                            </div>
                            <div className="py-3 border-b border-gray-700">
                                <p className="text-sm text-gray-400">Volume</p>
                                <p className="text-lg font-semibold">{(stock.volume / 1000000).toFixed(2)}M</p>
                            </div>
                            <div className="py-3 border-b border-gray-700">
                                <p className="text-sm text-gray-400">Day Range</p>
                                <p className="text-lg font-semibold">₹{stock.low.toLocaleString('en-IN')} - ₹{stock.high.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock Info */}
                <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">About {stock.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Symbol</p>
                            <p className="font-medium">{stock.symbol}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Sector</p>
                            <p className="font-medium">{stock.sector}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Last Trading Day</p>
                            <p className="font-medium">{stock.latestTradingDay}</p>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-700">
                        <p className="text-gray-400 text-sm">
                            <strong>Disclaimer:</strong> This data is for educational purposes only.
                            Stock prices shown are simulated and may not reflect actual market values.
                            Please consult a qualified financial advisor before making investment decisions.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 border-t border-gray-700 mt-8">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm">© 2025 Next-StockMarket</p>
                        <div className="flex items-center gap-6">
                            <Link href="/" className="text-gray-400 hover:text-white text-sm">
                                Dashboard
                            </Link>
                            <Link href="/blogs" className="text-gray-400 hover:text-white text-sm">
                                Expert Blogs
                            </Link>
                            {expert ? (
                                <>
                                    <Link href="/expert/profile" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                        Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <Link href="/expert/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                    Expert Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
