'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

interface MarketData {
    indices: Array<{
        symbol: string;
        name: string;
        value: number;
        change: number;
        changePercent: string;
        high: number;
        low: number;
    }>;
    topGainers: Array<{
        symbol: string;
        name: string;
        price: number;
        change: number;
        changePercent: string;
    }>;
    topLosers: Array<{
        symbol: string;
        name: string;
        price: number;
        change: number;
        changePercent: string;
    }>;
    sectorPerformance: Array<{
        sector: string;
        change: string;
        color: string;
    }>;
    marketStats: {
        advancers: number;
        decliners: number;
        unchanged: number;
        totalTurnover: string;
        marketCap: string;
        vix: number;
        fiiActivity: string;
        diiActivity: string;
    };
    lastUpdated: string;
    marketStatus: string;
}

interface Blog {
    id: string;
    title: string;
    content: string;
    expertName: string;
    expertDesignation: string;
    expertImage: string | null;
    createdAt: string;
}

interface Stock {
    symbol: string;
    name: string;
    sector: string;
}

interface RecentSearch {
    symbol: string;
    name: string;
    sector: string;
    searchedAt: number;
}

interface Expert {
    id: string;
    name: string;
    email: string;
    designation: string;
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

interface IPOData {
    upcoming: IPO[];
    open: IPO[];
    recentlyListed: IPO[];
}

export default function Dashboard() {
    const [marketData, setMarketData] = useState<MarketData | null>(null);
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);
    
    // Search state
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Stock[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    
    // Expert auth state
    const [expert, setExpert] = useState<Expert | null>(null);
    
    // IPO state
    const [ipoData, setIpoData] = useState<IPOData | null>(null);
    const [activeIpoTab, setActiveIpoTab] = useState<'open' | 'upcoming' | 'listed'>('open');
    
    // Navigation loading state
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    useEffect(() => {
        fetchMarketData();
        fetchBlogs();
        fetchStocks();
        fetchExpert();
        fetchIPOs();
        loadRecentSearches();
        
        // Auto-refresh market data every 30 seconds
        const interval = setInterval(fetchMarketData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadRecentSearches = () => {
        try {
            const saved = localStorage.getItem('recentStockSearches');
            if (saved) {
                const parsed = JSON.parse(saved) as RecentSearch[];
                setRecentSearches(parsed.slice(0, 5));
            }
        } catch (error) {
            console.error('Error loading recent searches:', error);
        }
    };

    const saveRecentSearch = (stock: Stock | { symbol: string; name: string; sector?: string }) => {
        try {
            const newSearch: RecentSearch = {
                symbol: stock.symbol,
                name: stock.name,
                sector: stock.sector || 'Unknown',
                searchedAt: Date.now(),
            };
            
            // Remove duplicate if exists and add new search at the beginning
            const filtered = recentSearches.filter(s => s.symbol !== stock.symbol);
            const updated = [newSearch, ...filtered].slice(0, 5);
            
            setRecentSearches(updated);
            localStorage.setItem('recentStockSearches', JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving recent search:', error);
        }
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentStockSearches');
    };

    const fetchMarketData = async () => {
        try {
            const res = await fetch('/api/stocks/market');
            const data = await res.json();
            if (data.success) {
                setMarketData(data.data);
            }
        } catch (error) {
            console.error('Error fetching market data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBlogs = async () => {
        try {
            const res = await fetch('/api/blogs?limit=4');
            const data = await res.json();
            if (data.success) {
                setBlogs(data.blogs);
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
        }
    };

    const fetchExpert = async () => {
        try {
            const res = await fetch('/api/expert/me');
            const data = await res.json();
            if (data.success && data.expert) {
                setExpert(data.expert);
            }
        } catch (error) {
            // Not logged in, ignore
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

    const fetchStocks = async () => {
        try {
            const res = await fetch('/api/stocks/quote');
            const data = await res.json();
            if (data.success) {
                setStocks(data.stocks);
            }
        } catch (error) {
            console.error('Error fetching stocks:', error);
        }
    };

    const fetchIPOs = async () => {
        try {
            const res = await fetch('/api/stocks/ipo');
            const data = await res.json();
            if (data.success) {
                setIpoData(data.data);
            }
        } catch (error) {
            console.error('Error fetching IPO data:', error);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.length > 0) {
            const filtered = stocks.filter(
                stock =>
                    (stock.name && stock.name.toLowerCase().includes(query.toLowerCase())) ||
                    (stock.symbol && stock.symbol.toLowerCase().includes(query.toLowerCase())) ||
                    (stock.sector && stock.sector.toLowerCase().includes(query.toLowerCase()))
            );
            setSearchResults(filtered);
            setShowSearchDropdown(true);
        } else {
            setSearchResults([]);
            // Show recent searches when query is empty but input is focused
            if (isSearchFocused && recentSearches.length > 0) {
                setShowSearchDropdown(true);
            } else {
                setShowSearchDropdown(false);
            }
        }
    };

    const handleSearchFocus = () => {
        setIsSearchFocused(true);
        if (searchQuery.length > 0) {
            setShowSearchDropdown(true);
        } else if (recentSearches.length > 0) {
            setShowSearchDropdown(true);
        }
    };

    const handleSearchBlur = () => {
        setIsSearchFocused(false);
    };

    const router = useRouter();

    const handleStockSelect = (stock: Stock | { symbol: string; name: string; price?: number; change?: number; changePercent?: string; sector?: string }) => {
        setShowSearchDropdown(false);
        setSearchQuery('');
        setIsSearchFocused(false);
        setNavigatingTo(stock.symbol);
        // Save to recent searches
        saveRecentSearch(stock);
        // Navigate to the stock detail page
        router.push(`/stock/${encodeURIComponent(stock.symbol)}`);
    };

    const handleRecentSearchSelect = (recentSearch: RecentSearch) => {
        setShowSearchDropdown(false);
        setSearchQuery('');
        setIsSearchFocused(false);
        setNavigatingTo(recentSearch.symbol);
        // Update recent search timestamp
        saveRecentSearch(recentSearch);
        // Navigate to the stock detail page
        router.push(`/stock/${encodeURIComponent(recentSearch.symbol)}`);
    };

    // Chart data for index performance - using useMemo to prevent re-render on every state change
    const indexChartData = useMemo(() => {
        const baseValue = marketData?.indices[selectedIndex]?.value || 22000;
        // Use a stable seed based on index symbol and today's date
        const seedBase = marketData?.indices[selectedIndex]?.symbol || 'NIFTY';
        const seed = seedBase.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + new Date().getDate();
        
        return {
            labels: ['9:15', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '15:30'],
            datasets: [
                {
                    label: marketData?.indices[selectedIndex]?.name || 'Index',
                    data: generateStableIntraday(baseValue, seed),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
            ],
        };
    }, [marketData?.indices, selectedIndex]);

    // Sector performance bar chart
    const sectorChartData = {
        labels: marketData?.sectorPerformance.map(s => s.sector) || [],
        datasets: [
            {
                label: 'Change %',
                data: marketData?.sectorPerformance.map(s => parseFloat(s.change)) || [],
                backgroundColor: marketData?.sectorPerformance.map(s => s.color) || [],
            },
        ],
    };

    // Market breadth doughnut
    const breadthData = {
        labels: ['Advancers', 'Decliners', 'Unchanged'],
        datasets: [
            {
                data: [
                    marketData?.marketStats.advancers || 0,
                    marketData?.marketStats.decliners || 0,
                    marketData?.marketStats.unchanged || 0,
                ],
                backgroundColor: ['#22c55e', '#ef4444', '#6b7280'],
            },
        ],
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading market data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Navigation Loading Overlay */}
            {navigatingTo && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="bg-gray-800 rounded-xl p-6 shadow-2xl text-center">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-300">Loading stock details...</p>
                        <p className="text-sm text-gray-500 mt-1">{navigatingTo}</p>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-blue-400">Next-StockMarket</h1>
                            <p className="text-sm text-gray-400">Indian Stock Market Dashboard</p>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative w-full md:w-96">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onFocus={handleSearchFocus}
                                    onBlur={handleSearchBlur}
                                    placeholder="Search stocks by name, symbol or sector..."
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                />
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            
                            {/* Search Dropdown - Recent Searches */}
                            {showSearchDropdown && !searchQuery && recentSearches.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                                    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-600">
                                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Recent Searches</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearRecentSearches();
                                                setShowSearchDropdown(false);
                                            }}
                                            className="text-xs text-red-400 hover:text-red-300 transition"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    {recentSearches.map((recent) => (
                                        <button
                                            key={recent.symbol}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleRecentSearchSelect(recent);
                                            }}
                                            disabled={navigatingTo !== null}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-600 transition flex justify-between items-center border-b border-gray-600 last:border-b-0 disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm sm:text-base truncate">{recent.name}</p>
                                                    <p className="text-xs sm:text-sm text-gray-400">{recent.symbol}</p>
                                                </div>
                                            </div>
                                            {navigatingTo === recent.symbol ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full flex-shrink-0"></div>
                                            ) : (
                                                <span className="text-xs bg-gray-600 px-2 py-1 rounded flex-shrink-0 hidden sm:inline">
                                                    {recent.sector}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {/* Search Dropdown - Search Results */}
                            {showSearchDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                                    {searchResults.map((stock) => (
                                        <button
                                            key={stock.symbol}
                                            onClick={() => handleStockSelect(stock)}
                                            disabled={navigatingTo !== null}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-600 transition flex justify-between items-center border-b border-gray-600 last:border-b-0 disabled:opacity-50"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm sm:text-base truncate">{stock.name}</p>
                                                <p className="text-xs sm:text-sm text-gray-400">{stock.symbol}</p>
                                            </div>
                                            {navigatingTo === stock.symbol ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full flex-shrink-0"></div>
                                            ) : (
                                                <span className="text-xs bg-gray-600 px-2 py-1 rounded flex-shrink-0 ml-2 hidden sm:inline">
                                                    {stock.sector}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {showSearchDropdown && searchQuery && searchResults.length === 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 p-4 text-center text-gray-400 text-sm">
                                    No stocks found for &quot;{searchQuery}&quot;
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                marketData?.marketStatus === 'OPEN' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                            }`}>
                                Market {marketData?.marketStatus}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Click outside to close search dropdown */}
            {showSearchDropdown && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                        setShowSearchDropdown(false);
                        setIsSearchFocused(false);
                    }}
                />
            )}

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Market Indices */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {marketData?.indices.map((index, i) => (
                        <div
                            key={index.symbol}
                            onClick={() => setSelectedIndex(i)}
                            className={`p-4 rounded-xl cursor-pointer transition-all ${
                                selectedIndex === i 
                                    ? 'bg-blue-600 ring-2 ring-blue-400' 
                                    : 'bg-gray-800 hover:bg-gray-750'
                            }`}
                        >
                            <p className="text-sm text-gray-400">{index.name}</p>
                            <p className="text-xl font-bold">{index.value.toLocaleString('en-IN')}</p>
                            <p className={`text-sm font-medium ${
                                index.change >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent})
                            </p>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Index Chart */}
                    <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-4">
                            {marketData?.indices[selectedIndex]?.name} - Intraday
                        </h3>
                        <div className="h-64">
                            <Line
                                data={indexChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { color: 'rgba(255,255,255,0.1)' } },
                                        x: { grid: { display: false } },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    {/* Market Breadth */}
                    <div className="bg-gray-800 rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-4">Market Breadth</h3>
                        <div className="h-48">
                            <Doughnut
                                data={breadthData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'bottom' },
                                    },
                                }}
                            />
                        </div>
                        <div className="mt-4 text-center text-sm text-gray-400">
                            VIX: <span className="text-yellow-400 font-medium">{marketData?.marketStats.vix.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Sector Performance & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Sector Performance */}
                    <div className="bg-gray-800 rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-4">Sector Performance</h3>
                        <div className="h-64">
                            <Bar
                                data={sectorChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { color: 'rgba(255,255,255,0.1)' } },
                                        x: { grid: { display: false } },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    {/* Market Stats */}
                    <div className="bg-gray-800 rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-4">Market Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label="Total Turnover" value={marketData?.marketStats.totalTurnover || ''} />
                            <StatCard label="Market Cap" value={marketData?.marketStats.marketCap || ''} />
                            <StatCard label="FII Activity" value={marketData?.marketStats.fiiActivity || ''} color="text-green-400" />
                            <StatCard label="DII Activity" value={marketData?.marketStats.diiActivity || ''} color="text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Top Gainers & Losers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Top Gainers */}
                    <div className="bg-gray-800 rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-4 text-green-400">📈 Top Gainers</h3>
                        <div className="space-y-2">
                            {marketData?.topGainers.map((stock) => (
                                <button
                                    key={stock.symbol}
                                    onClick={() => handleStockSelect(stock)}
                                    disabled={navigatingTo !== null}
                                    className="w-full flex justify-between items-center p-3 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition cursor-pointer disabled:opacity-50"
                                >
                                    <div className="text-left">
                                        <p className="font-medium">{stock.name}</p>
                                        <p className="text-sm text-gray-400">{stock.symbol}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        {navigatingTo === stock.symbol ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="font-medium">₹{stock.price.toLocaleString('en-IN')}</p>
                                                    <p className="text-sm text-green-400">{stock.changePercent}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Top Losers */}
                    <div className="bg-gray-800 rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-4 text-red-400">📉 Top Losers</h3>
                        <div className="space-y-2">
                            {marketData?.topLosers.map((stock) => (
                                <button
                                    key={stock.symbol}
                                    onClick={() => handleStockSelect(stock)}
                                    disabled={navigatingTo !== null}
                                    className="w-full flex justify-between items-center p-3 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition cursor-pointer disabled:opacity-50"
                                >
                                    <div className="text-left">
                                        <p className="font-medium">{stock.name}</p>
                                        <p className="text-sm text-gray-400">{stock.symbol}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        {navigatingTo === stock.symbol ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full"></div>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="font-medium">₹{stock.price.toLocaleString('en-IN')}</p>
                                                    <p className="text-sm text-red-400">{stock.changePercent}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* IPO Section */}
                <section className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">📋 IPO Corner</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveIpoTab('open')}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                                    activeIpoTab === 'open'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                Open ({ipoData?.open.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveIpoTab('upcoming')}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                                    activeIpoTab === 'upcoming'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                Upcoming ({ipoData?.upcoming.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveIpoTab('listed')}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                                    activeIpoTab === 'listed'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                Recently Listed ({ipoData?.recentlyListed.length || 0})
                            </button>
                        </div>
                    </div>

                    {/* Open IPOs */}
                    {activeIpoTab === 'open' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ipoData?.open.length === 0 ? (
                                <div className="col-span-2 bg-gray-800 rounded-xl p-8 text-center">
                                    <p className="text-gray-400">No IPOs currently open for subscription.</p>
                                </div>
                            ) : (
                                ipoData?.open.map((ipo) => (
                                    <div key={ipo.id} className="bg-gradient-to-br from-green-900/30 to-gray-800 rounded-xl p-5 border border-green-500/30">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-lg">{ipo.companyName}</h3>
                                                <span className="text-xs bg-green-600 px-2 py-0.5 rounded-full">OPEN</span>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${ipo.category === 'SME' ? 'bg-yellow-600' : 'bg-blue-600'}`}>
                                                {ipo.category}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                            <div>
                                                <p className="text-gray-400">Price Band</p>
                                                <p className="font-semibold">{ipo.priceRange}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Issue Size</p>
                                                <p className="font-semibold">{ipo.issueSize}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Lot Size</p>
                                                <p className="font-semibold">{ipo.lotSize} shares</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Opens</p>
                                                <p className="font-semibold">{new Date(ipo.openDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>Closes: {new Date(ipo.closeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                            <span>{ipo.exchange}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Upcoming IPOs */}
                    {activeIpoTab === 'upcoming' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ipoData?.upcoming.length === 0 ? (
                                <div className="col-span-3 bg-gray-800 rounded-xl p-8 text-center">
                                    <p className="text-gray-400">No upcoming IPOs at the moment.</p>
                                </div>
                            ) : (
                                ipoData?.upcoming.map((ipo) => (
                                    <div key={ipo.id} className="bg-gradient-to-br from-blue-900/30 to-gray-800 rounded-xl p-4 border border-blue-500/30">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold">{ipo.companyName}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    ipo.category === 'SME' ? 'bg-yellow-600' : 'bg-blue-600'
                                                }`}>{ipo.category}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                            <div>
                                                <p className="text-gray-400 text-xs">Price Band</p>
                                                <p className="font-semibold">{ipo.priceRange}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs">Issue Size</p>
                                                <p className="font-semibold">{ipo.issueSize}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs">Lot Size</p>
                                                <p className="font-semibold">{ipo.lotSize} shares</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs">Closes</p>
                                                <p className="font-semibold">{new Date(ipo.closeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-400 border-t border-gray-700 pt-2">
                                            <span>Opens: {new Date(ipo.openDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                            <span>{ipo.exchange}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Recently Listed IPOs */}
                    {activeIpoTab === 'listed' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ipoData?.recentlyListed.length === 0 ? (
                                <div className="col-span-3 bg-gray-800 rounded-xl p-8 text-center">
                                    <p className="text-gray-400">No recently listed IPOs found.</p>
                                </div>
                            ) : (
                                ipoData?.recentlyListed.map((ipo) => (
                                    <div key={ipo.id} className="bg-gradient-to-br from-purple-900/30 to-gray-800 rounded-xl p-4 border border-purple-500/30">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold">{ipo.companyName}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    ipo.category === 'SME' ? 'bg-yellow-600' : 'bg-purple-600'
                                                }`}>{ipo.category}</span>
                                            </div>
                                            {ipo.listingGain && (
                                                <div className={`text-right ${
                                                    ipo.listingGain?.startsWith('+') ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                    <p className="text-lg font-bold">{ipo.listingGain}</p>
                                                    <p className="text-xs">Listing Gain</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                            <div>
                                                <p className="text-gray-400 text-xs">Issue Price</p>
                                                <p className="font-semibold">{ipo.priceRange}</p>
                                            </div>
                                            {ipo.listingPrice && (
                                                <div>
                                                    <p className="text-gray-400 text-xs">Listing Price</p>
                                                    <p className="font-semibold text-purple-400">₹{ipo.listingPrice?.toLocaleString('en-IN')}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-gray-400 text-xs">Issue Size</p>
                                                <p className="font-semibold">{ipo.issueSize}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs">Lot Size</p>
                                                <p className="font-semibold">{ipo.lotSize} shares</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-400 border-t border-gray-700 pt-2">
                                            <span>Listed: {ipo.listingDate ? new Date(ipo.listingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}</span>
                                            <span>{ipo.exchange}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </section>

                {/* Expert Advice Section */}
                <section className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">💡 Expert Advice</h2>
                        <Link href="/blogs" className="text-blue-400 hover:underline text-sm">
                            View All →
                        </Link>
                    </div>
                    
                    {blogs.length === 0 ? (
                        <div className="bg-gray-800 rounded-xl p-8 text-center">
                            <p className="text-gray-400">No expert blogs available yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {blogs.map((blog) => (
                                <Link key={blog.id} href={`/blogs/${blog.id}`}>
                                    <div className="bg-gray-800 rounded-xl p-4 h-full hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer">
                                        <div className="flex items-center gap-3 mb-3">
                                            {blog.expertImage ? (
                                                <img
                                                    src={blog.expertImage}
                                                    alt={blog.expertName}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                                                    {blog.expertName.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-sm">{blog.expertName}</p>
                                                <p className="text-xs text-gray-400">{blog.expertDesignation}</p>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold mb-2 line-clamp-2">{blog.title}</h3>
                                        <p className="text-sm text-gray-400 line-clamp-2">{blog.content}</p>
                                        <p className="text-xs text-gray-500 mt-3">
                                            {new Date(blog.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 border-t border-gray-700 mt-8">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-gray-400 text-sm">© 2025 Next-StockMarket. All rights reserved.</p>
                            <p className="text-gray-500 text-xs mt-1">Data for educational purposes only. Not financial advice.</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <Link href="/blogs" className="text-gray-400 hover:text-white text-sm">
                                Expert Blogs
                            </Link>
                            {expert ? (
                                <>
                                    <Link href="/expert/write-blog" className="text-green-400 hover:text-green-300 text-sm font-medium">
                                        Write Blog
                                    </Link>
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

function StatCard({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
    return (
        <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`text-lg font-semibold ${color}`}>{value}</p>
        </div>
    );
}

// Seeded random function for stable values
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateStableIntraday(baseValue: number, seed: number): number[] {
    const data: number[] = [];
    let current = baseValue * 0.998;
    for (let i = 0; i < 8; i++) {
        current = current + (seededRandom(seed + i) - 0.45) * (baseValue * 0.002);
        data.push(parseFloat(current.toFixed(2)));
    }
    return data;
}
