import { NextResponse } from 'next/server';
import { getAllStocks, getStockQuote } from '@/helpers/nseHelper';
import { ALL_NSE_STOCKS } from '@/helpers/allStocksData';

// Alpha Vantage API configuration (fallback)
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Static fallback list of Indian stocks (NSE) - Used when NSE API is unavailable
const FALLBACK_INDIAN_STOCKS = [
    // NIFTY 50 Stocks
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking' },
    { symbol: 'INFY.NS', name: 'Infosys', sector: 'IT' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom' },
    { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Infrastructure' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Consumer Goods' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Automobile' },
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', sector: 'Pharma' },
    { symbol: 'TITAN.NS', name: 'Titan Company', sector: 'Consumer Goods' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Finance' },
    { symbol: 'WIPRO.NS', name: 'Wipro', sector: 'IT' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'IT' },
    { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Cement' },
    { symbol: 'NTPC.NS', name: 'NTPC', sector: 'Power' },
    { symbol: 'POWERGRID.NS', name: 'Power Grid Corp', sector: 'Power' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Automobile' },
    { symbol: 'TATASTEEL.NS', name: 'Tata Steel', sector: 'Metal' },
    { symbol: 'ONGC.NS', name: 'ONGC', sector: 'Energy' },
    { symbol: 'COALINDIA.NS', name: 'Coal India', sector: 'Mining' },
    { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', sector: 'Metal' },
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', sector: 'Conglomerate' },
    { symbol: 'ADANIPORTS.NS', name: 'Adani Ports', sector: 'Infrastructure' },
    { symbol: 'TECHM.NS', name: 'Tech Mahindra', sector: 'IT' },
    { symbol: 'DRREDDY.NS', name: 'Dr Reddys Labs', sector: 'Pharma' },
    { symbol: 'CIPLA.NS', name: 'Cipla', sector: 'Pharma' },
    { symbol: 'BRITANNIA.NS', name: 'Britannia Industries', sector: 'FMCG' },
    { symbol: 'NESTLEIND.NS', name: 'Nestle India', sector: 'FMCG' },
    { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', sector: 'Finance' },
    { symbol: 'DIVISLAB.NS', name: 'Divis Laboratories', sector: 'Pharma' },
    { symbol: 'GRASIM.NS', name: 'Grasim Industries', sector: 'Cement' },
    { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank', sector: 'Banking' },
    { symbol: 'HINDALCO.NS', name: 'Hindalco Industries', sector: 'Metal' },
    { symbol: 'BPCL.NS', name: 'BPCL', sector: 'Energy' },
    { symbol: 'EICHERMOT.NS', name: 'Eicher Motors', sector: 'Automobile' },
    { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp', sector: 'Automobile' },
    { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals', sector: 'Healthcare' },
    { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance', sector: 'Insurance' },
    { symbol: 'HDFCLIFE.NS', name: 'HDFC Life Insurance', sector: 'Insurance' },
    { symbol: 'TATACONSUM.NS', name: 'Tata Consumer Products', sector: 'FMCG' },
    { symbol: 'M&M.NS', name: 'Mahindra & Mahindra', sector: 'Automobile' },
    { symbol: 'SHREECEM.NS', name: 'Shree Cement', sector: 'Cement' },
    { symbol: 'UPL.NS', name: 'UPL', sector: 'Chemicals' },
    { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto', sector: 'Automobile' },
    
    // NIFTY NEXT 50 & Popular Stocks
    { symbol: 'ADANIGREEN.NS', name: 'Adani Green Energy', sector: 'Power' },
    { symbol: 'ADANITRANS.NS', name: 'Adani Transmission', sector: 'Power' },
    { symbol: 'AMBUJACEM.NS', name: 'Ambuja Cements', sector: 'Cement' },
    { symbol: 'ACC.NS', name: 'ACC Limited', sector: 'Cement' },
    { symbol: 'PIDILITIND.NS', name: 'Pidilite Industries', sector: 'Chemicals' },
    { symbol: 'SIEMENS.NS', name: 'Siemens', sector: 'Engineering' },
    { symbol: 'HAVELLS.NS', name: 'Havells India', sector: 'Consumer Durables' },
    { symbol: 'GODREJCP.NS', name: 'Godrej Consumer Products', sector: 'FMCG' },
    { symbol: 'DABUR.NS', name: 'Dabur India', sector: 'FMCG' },
    { symbol: 'MARICO.NS', name: 'Marico', sector: 'FMCG' },
    { symbol: 'COLPAL.NS', name: 'Colgate Palmolive', sector: 'FMCG' },
    { symbol: 'BERGEPAINT.NS', name: 'Berger Paints', sector: 'Consumer Goods' },
    { symbol: 'DLF.NS', name: 'DLF Limited', sector: 'Real Estate' },
    { symbol: 'GODREJPROP.NS', name: 'Godrej Properties', sector: 'Real Estate' },
    { symbol: 'OBEROIRLTY.NS', name: 'Oberoi Realty', sector: 'Real Estate' },
    { symbol: 'PRESTIGE.NS', name: 'Prestige Estates', sector: 'Real Estate' },
    { symbol: 'PHOENIXLTD.NS', name: 'Phoenix Mills', sector: 'Real Estate' },
    { symbol: 'SOBHA.NS', name: 'Sobha Limited', sector: 'Real Estate' },
    { symbol: 'BRIGADE.NS', name: 'Brigade Enterprises', sector: 'Real Estate' },
    
    // Banking & Finance
    { symbol: 'BANDHANBNK.NS', name: 'Bandhan Bank', sector: 'Banking' },
    { symbol: 'FEDERALBNK.NS', name: 'Federal Bank', sector: 'Banking' },
    { symbol: 'IDFCFIRSTB.NS', name: 'IDFC First Bank', sector: 'Banking' },
    { symbol: 'PNB.NS', name: 'Punjab National Bank', sector: 'Banking' },
    { symbol: 'BANKBARODA.NS', name: 'Bank of Baroda', sector: 'Banking' },
    { symbol: 'CANBK.NS', name: 'Canara Bank', sector: 'Banking' },
    { symbol: 'UNIONBANK.NS', name: 'Union Bank of India', sector: 'Banking' },
    { symbol: 'IOB.NS', name: 'Indian Overseas Bank', sector: 'Banking' },
    { symbol: 'RBLBANK.NS', name: 'RBL Bank', sector: 'Banking' },
    { symbol: 'AUBANK.NS', name: 'AU Small Finance Bank', sector: 'Banking' },
    { symbol: 'YESBANK.NS', name: 'Yes Bank', sector: 'Banking' },
    { symbol: 'HDFC.NS', name: 'HDFC Limited', sector: 'Finance' },
    { symbol: 'MUTHOOTFIN.NS', name: 'Muthoot Finance', sector: 'Finance' },
    { symbol: 'CHOLAFIN.NS', name: 'Cholamandalam Finance', sector: 'Finance' },
    { symbol: 'M&MFIN.NS', name: 'M&M Financial Services', sector: 'Finance' },
    { symbol: 'SBICARD.NS', name: 'SBI Cards', sector: 'Finance' },
    { symbol: 'ICICIGI.NS', name: 'ICICI Lombard', sector: 'Insurance' },
    { symbol: 'ICICIPRULI.NS', name: 'ICICI Prudential Life', sector: 'Insurance' },
    { symbol: 'HDFCAMC.NS', name: 'HDFC AMC', sector: 'Finance' },
    { symbol: 'LICI.NS', name: 'LIC India', sector: 'Insurance' },
    
    // IT & Tech
    { symbol: 'LTIM.NS', name: 'LTIMindtree', sector: 'IT' },
    { symbol: 'MPHASIS.NS', name: 'Mphasis', sector: 'IT' },
    { symbol: 'COFORGE.NS', name: 'Coforge', sector: 'IT' },
    { symbol: 'PERSISTENT.NS', name: 'Persistent Systems', sector: 'IT' },
    { symbol: 'LTTS.NS', name: 'L&T Technology Services', sector: 'IT' },
    { symbol: 'MINDTREE.NS', name: 'Mindtree', sector: 'IT' },
    { symbol: 'NIITLTD.NS', name: 'NIIT Limited', sector: 'IT' },
    { symbol: 'TATAELXSI.NS', name: 'Tata Elxsi', sector: 'IT' },
    { symbol: 'HAPPSTMNDS.NS', name: 'Happiest Minds', sector: 'IT' },
    { symbol: 'ROUTE.NS', name: 'Route Mobile', sector: 'IT' },
    { symbol: 'ZOMATO.NS', name: 'Zomato', sector: 'Internet' },
    { symbol: 'PAYTM.NS', name: 'Paytm (One97)', sector: 'Fintech' },
    { symbol: 'NYKAA.NS', name: 'FSN E-Commerce (Nykaa)', sector: 'E-Commerce' },
    { symbol: 'POLICYBZR.NS', name: 'PB Fintech (PolicyBazaar)', sector: 'Fintech' },
    { symbol: 'DELHIVERY.NS', name: 'Delhivery', sector: 'Logistics' },
    { symbol: 'CARTRADE.NS', name: 'CarTrade Tech', sector: 'Internet' },
    
    // Pharma & Healthcare
    { symbol: 'LUPIN.NS', name: 'Lupin', sector: 'Pharma' },
    { symbol: 'AUROPHARMA.NS', name: 'Aurobindo Pharma', sector: 'Pharma' },
    { symbol: 'BIOCON.NS', name: 'Biocon', sector: 'Pharma' },
    { symbol: 'TORNTPHARM.NS', name: 'Torrent Pharma', sector: 'Pharma' },
    { symbol: 'ALKEM.NS', name: 'Alkem Laboratories', sector: 'Pharma' },
    { symbol: 'GLENMARK.NS', name: 'Glenmark Pharma', sector: 'Pharma' },
    { symbol: 'IPCALAB.NS', name: 'IPCA Labs', sector: 'Pharma' },
    { symbol: 'ABBOTINDIA.NS', name: 'Abbott India', sector: 'Pharma' },
    { symbol: 'PFIZER.NS', name: 'Pfizer', sector: 'Pharma' },
    { symbol: 'SANOFI.NS', name: 'Sanofi India', sector: 'Pharma' },
    { symbol: 'LAURUSLABS.NS', name: 'Laurus Labs', sector: 'Pharma' },
    { symbol: 'NATCOPHARM.NS', name: 'Natco Pharma', sector: 'Pharma' },
    { symbol: 'MAXHEALTH.NS', name: 'Max Healthcare', sector: 'Healthcare' },
    { symbol: 'FORTIS.NS', name: 'Fortis Healthcare', sector: 'Healthcare' },
    { symbol: 'METROPOLIS.NS', name: 'Metropolis Healthcare', sector: 'Healthcare' },
    { symbol: 'LALPATHLAB.NS', name: 'Dr Lal PathLabs', sector: 'Healthcare' },
    { symbol: 'THYROCARE.NS', name: 'Thyrocare Technologies', sector: 'Healthcare' },
    
    // Auto & Auto Ancillary
    { symbol: 'TVSMOTOR.NS', name: 'TVS Motor Company', sector: 'Automobile' },
    { symbol: 'ASHOKLEY.NS', name: 'Ashok Leyland', sector: 'Automobile' },
    { symbol: 'ESCORTS.NS', name: 'Escorts Kubota', sector: 'Automobile' },
    { symbol: 'MOTHERSON.NS', name: 'Motherson Sumi', sector: 'Auto Ancillary' },
    { symbol: 'BOSCHLTD.NS', name: 'Bosch', sector: 'Auto Ancillary' },
    { symbol: 'MRF.NS', name: 'MRF', sector: 'Auto Ancillary' },
    { symbol: 'APOLLOTYRE.NS', name: 'Apollo Tyres', sector: 'Auto Ancillary' },
    { symbol: 'BALKRISIND.NS', name: 'Balkrishna Industries', sector: 'Auto Ancillary' },
    { symbol: 'CEATLTD.NS', name: 'CEAT', sector: 'Auto Ancillary' },
    { symbol: 'EXIDEIND.NS', name: 'Exide Industries', sector: 'Auto Ancillary' },
    { symbol: 'AMARAJABAT.NS', name: 'Amara Raja Batteries', sector: 'Auto Ancillary' },
    { symbol: 'BHEL.NS', name: 'BHEL', sector: 'Engineering' },
    
    // Power & Energy
    { symbol: 'TATAPOWER.NS', name: 'Tata Power', sector: 'Power' },
    { symbol: 'ADANIPOWER.NS', name: 'Adani Power', sector: 'Power' },
    { symbol: 'TORNTPOWER.NS', name: 'Torrent Power', sector: 'Power' },
    { symbol: 'CESC.NS', name: 'CESC', sector: 'Power' },
    { symbol: 'NHPC.NS', name: 'NHPC', sector: 'Power' },
    { symbol: 'SJVN.NS', name: 'SJVN', sector: 'Power' },
    { symbol: 'RECLTD.NS', name: 'REC Limited', sector: 'Power Finance' },
    { symbol: 'PFC.NS', name: 'Power Finance Corp', sector: 'Power Finance' },
    { symbol: 'IOC.NS', name: 'Indian Oil Corp', sector: 'Energy' },
    { symbol: 'HINDPETRO.NS', name: 'Hindustan Petroleum', sector: 'Energy' },
    { symbol: 'GAIL.NS', name: 'GAIL India', sector: 'Energy' },
    { symbol: 'IGL.NS', name: 'Indraprastha Gas', sector: 'Energy' },
    { symbol: 'MGL.NS', name: 'Mahanagar Gas', sector: 'Energy' },
    { symbol: 'PETRONET.NS', name: 'Petronet LNG', sector: 'Energy' },
    { symbol: 'GSPL.NS', name: 'Gujarat State Petronet', sector: 'Energy' },
    
    // Metals & Mining
    { symbol: 'VEDL.NS', name: 'Vedanta', sector: 'Metal' },
    { symbol: 'NMDC.NS', name: 'NMDC', sector: 'Mining' },
    { symbol: 'NATIONALUM.NS', name: 'National Aluminium', sector: 'Metal' },
    { symbol: 'SAIL.NS', name: 'SAIL', sector: 'Metal' },
    { symbol: 'JINDALSTEL.NS', name: 'Jindal Steel & Power', sector: 'Metal' },
    { symbol: 'MOIL.NS', name: 'MOIL', sector: 'Mining' },
    
    // Telecom & Media
    { symbol: 'IDEA.NS', name: 'Vodafone Idea', sector: 'Telecom' },
    { symbol: 'INDUSTOWER.NS', name: 'Indus Towers', sector: 'Telecom' },
    { symbol: 'TATACOMM.NS', name: 'Tata Communications', sector: 'Telecom' },
    { symbol: 'ZEEL.NS', name: 'Zee Entertainment', sector: 'Media' },
    { symbol: 'SUNTV.NS', name: 'Sun TV Network', sector: 'Media' },
    { symbol: 'PVR.NS', name: 'PVR INOX', sector: 'Media' },
    { symbol: 'PVRINOX.NS', name: 'PVR INOX', sector: 'Media' },
    
    // Consumer Durables & Retail
    { symbol: 'VOLTAS.NS', name: 'Voltas', sector: 'Consumer Durables' },
    { symbol: 'WHIRLPOOL.NS', name: 'Whirlpool India', sector: 'Consumer Durables' },
    { symbol: 'BLUESTARCO.NS', name: 'Blue Star', sector: 'Consumer Durables' },
    { symbol: 'CROMPTON.NS', name: 'Crompton Greaves', sector: 'Consumer Durables' },
    { symbol: 'KAJARIACER.NS', name: 'Kajaria Ceramics', sector: 'Consumer Durables' },
    { symbol: 'BATAINDIA.NS', name: 'Bata India', sector: 'Retail' },
    { symbol: 'TRENT.NS', name: 'Trent', sector: 'Retail' },
    { symbol: 'DMART.NS', name: 'Avenue Supermarts (DMart)', sector: 'Retail' },
    { symbol: 'JUBLFOOD.NS', name: 'Jubilant FoodWorks', sector: 'Retail' },
    { symbol: 'RELAXO.NS', name: 'Relaxo Footwears', sector: 'Retail' },
    { symbol: 'PAGEIND.NS', name: 'Page Industries', sector: 'Textile' },
    { symbol: 'VMART.NS', name: 'V-Mart Retail', sector: 'Retail' },
    
    // Infrastructure & Construction
    { symbol: 'ADANIGREEN.NS', name: 'Adani Green', sector: 'Infrastructure' },
    { symbol: 'IRB.NS', name: 'IRB Infrastructure', sector: 'Infrastructure' },
    { symbol: 'GMRINFRA.NS', name: 'GMR Infrastructure', sector: 'Infrastructure' },
    { symbol: 'NBCC.NS', name: 'NBCC India', sector: 'Construction' },
    { symbol: 'NCC.NS', name: 'NCC Limited', sector: 'Construction' },
    { symbol: 'KNRCON.NS', name: 'KNR Constructions', sector: 'Construction' },
    { symbol: 'PEL.NS', name: 'Piramal Enterprises', sector: 'Diversified' },
    
    // Chemicals & Fertilizers
    { symbol: 'SRF.NS', name: 'SRF Limited', sector: 'Chemicals' },
    { symbol: 'AARTI IND.NS', name: 'Aarti Industries', sector: 'Chemicals' },
    { symbol: 'DEEPAKNTR.NS', name: 'Deepak Nitrite', sector: 'Chemicals' },
    { symbol: 'NAVINFLUOR.NS', name: 'Navin Fluorine', sector: 'Chemicals' },
    { symbol: 'FINEORG.NS', name: 'Fine Organic', sector: 'Chemicals' },
    { symbol: 'PIIND.NS', name: 'PI Industries', sector: 'Chemicals' },
    { symbol: 'COROMANDEL.NS', name: 'Coromandel International', sector: 'Fertilizers' },
    { symbol: 'CHAMBLFERT.NS', name: 'Chambal Fertilizers', sector: 'Fertilizers' },
    { symbol: 'GNFC.NS', name: 'GNFC', sector: 'Fertilizers' },
    { symbol: 'GSFC.NS', name: 'GSFC', sector: 'Fertilizers' },
    
    // Railways & PSUs
    { symbol: 'IRCTC.NS', name: 'IRCTC', sector: 'Railways' },
    { symbol: 'IRFC.NS', name: 'Indian Railway Finance', sector: 'Railways' },
    { symbol: 'RVNL.NS', name: 'Rail Vikas Nigam', sector: 'Railways' },
    { symbol: 'CONCOR.NS', name: 'Container Corp', sector: 'Logistics' },
    { symbol: 'HFCL.NS', name: 'HFCL', sector: 'Telecom Equipment' },
    { symbol: 'BEL.NS', name: 'Bharat Electronics', sector: 'Defence' },
    { symbol: 'HAL.NS', name: 'Hindustan Aeronautics', sector: 'Defence' },
    { symbol: 'BEML.NS', name: 'BEML', sector: 'Defence' },
    { symbol: 'COCHINSHIP.NS', name: 'Cochin Shipyard', sector: 'Defence' },
    { symbol: 'MAZAGON.NS', name: 'Mazagon Dock', sector: 'Defence' },
    { symbol: 'GRSE.NS', name: 'Garden Reach Shipbuilders', sector: 'Defence' },
    
    // Miscellaneous Popular Stocks
    { symbol: 'INDIGO.NS', name: 'InterGlobe Aviation (IndiGo)', sector: 'Aviation' },
    { symbol: 'SPICEJET.NS', name: 'SpiceJet', sector: 'Aviation' },
    { symbol: 'TATACOMM.NS', name: 'Tata Communications', sector: 'Telecom' },
    { symbol: 'TATACHEM.NS', name: 'Tata Chemicals', sector: 'Chemicals' },
    { symbol: 'HINDZINC.NS', name: 'Hindustan Zinc', sector: 'Metal' },
    { symbol: 'IEX.NS', name: 'Indian Energy Exchange', sector: 'Exchange' },
    { symbol: 'CDSL.NS', name: 'CDSL', sector: 'Exchange' },
    { symbol: 'MCX.NS', name: 'MCX India', sector: 'Exchange' },
    { symbol: 'BSE.NS', name: 'BSE Limited', sector: 'Exchange' },
    { symbol: 'ASTRAL.NS', name: 'Astral Ltd', sector: 'Building Materials' },
    { symbol: 'SUPREMEIND.NS', name: 'Supreme Industries', sector: 'Plastics' },
    { symbol: 'KEI.NS', name: 'KEI Industries', sector: 'Cables' },
    { symbol: 'POLYCAB.NS', name: 'Polycab India', sector: 'Cables' },
    { symbol: 'DIXON.NS', name: 'Dixon Technologies', sector: 'Electronics' },
    { symbol: 'AFFLE.NS', name: 'Affle India', sector: 'IT' },
    { symbol: 'TANLA.NS', name: 'Tanla Platforms', sector: 'IT' },
    { symbol: 'JUSTDIAL.NS', name: 'Just Dial', sector: 'Internet' },
    { symbol: 'INFOEDGE.NS', name: 'Info Edge (Naukri)', sector: 'Internet' },
    { symbol: 'INDIAMART.NS', name: 'IndiaMART', sector: 'Internet' },
    { symbol: 'LATENTVIEW.NS', name: 'Latent View Analytics', sector: 'IT' },
    { symbol: 'CLEAN.NS', name: 'Clean Science', sector: 'Chemicals' },
    { symbol: 'LODHA.NS', name: 'Macrotech Developers (Lodha)', sector: 'Real Estate' },
    { symbol: 'SYNGENE.NS', name: 'Syngene International', sector: 'Pharma' },
    { symbol: 'STARHEALTH.NS', name: 'Star Health Insurance', sector: 'Insurance' },
    { symbol: 'NIACL.NS', name: 'New India Assurance', sector: 'Insurance' },
    { symbol: 'GICRE.NS', name: 'GIC Re', sector: 'Insurance' },
    { symbol: 'GRINDWELL.NS', name: 'Grindwell Norton', sector: 'Engineering' },
    { symbol: 'CUMMINSIND.NS', name: 'Cummins India', sector: 'Engineering' },
    { symbol: 'ABB.NS', name: 'ABB India', sector: 'Engineering' },
    { symbol: 'HONAUT.NS', name: 'Honeywell Automation', sector: 'Engineering' },
    { symbol: 'THERMAX.NS', name: 'Thermax', sector: 'Engineering' },
    { symbol: 'TATATECH.NS', name: 'Tata Technologies', sector: 'IT' },
    { symbol: 'JSWENERGY.NS', name: 'JSW Energy', sector: 'Power' },
    { symbol: 'JIOFIN.NS', name: 'Jio Financial Services', sector: 'Finance' },
    { symbol: 'MANKIND.NS', name: 'Mankind Pharma', sector: 'Pharma' },
];

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

        if (!symbol) {
            // Try to get all stocks from NSE first
            try {
                const nseStocks = await getAllStocks();
                
                // Create a map of NSE live stocks with all fields
                const nseStockMap = new Map<string, any>();
                nseStocks.forEach(stock => {
                    nseStockMap.set(stock.symbol, {
                        symbol: stock.symbol,
                        name: stock.name,
                        lastPrice: stock.lastPrice,
                        change: stock.change,
                        pChange: stock.pChange,
                        open: stock.open,
                        dayHigh: stock.high,
                        dayLow: stock.low,
                        previousClose: stock.previousClose,
                        totalTradedVolume: stock.totalTradedVolume,
                        sector: stock.sector
                    });
                });
                
                // Merge with extended static list (add stocks not in NSE live data)
                const allStaticStocks = [...FALLBACK_INDIAN_STOCKS, ...ALL_NSE_STOCKS];
                allStaticStocks.forEach(stock => {
                    if (!nseStockMap.has(stock.symbol)) {
                        nseStockMap.set(stock.symbol, {
                            symbol: stock.symbol,
                            name: stock.name,
                            sector: stock.sector
                        });
                    }
                });
                
                // Convert map to array and sort alphabetically
                const mergedStocks = Array.from(nseStockMap.values())
                    .sort((a, b) => a.symbol.localeCompare(b.symbol));
                
                return NextResponse.json({
                    success: true,
                    source: 'NSE+Master',
                    totalStocks: mergedStocks.length,
                    liveStocks: nseStocks.length,
                    stocks: mergedStocks
                });
            } catch (nseError) {
                console.log('NSE API unavailable, using fallback list');
            }
            
            // Fallback to combined static list if NSE fails
            const allStaticStocks = [...FALLBACK_INDIAN_STOCKS, ...ALL_NSE_STOCKS];
            const uniqueStocks = Array.from(
                new Map(allStaticStocks.map(s => [s.symbol, s])).values()
            ).sort((a, b) => a.symbol.localeCompare(b.symbol));
            
            return NextResponse.json({
                success: true,
                source: 'fallback',
                totalStocks: uniqueStocks.length,
                stocks: uniqueStocks
            });
        }

        // Fetch quote data for the specific stock
        const quoteUrl = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();

        if (quoteData['Error Message'] || quoteData['Note']) {
            return NextResponse.json({
                success: false,
                error: quoteData['Error Message'] || 'API rate limit exceeded. Please try again later.'
            }, { status: 429 });
        }

        const globalQuote = quoteData['Global Quote'];
        
        if (!globalQuote || Object.keys(globalQuote).length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No data available for this stock'
            }, { status: 404 });
        }

        const stockInfo = FALLBACK_INDIAN_STOCKS.find(s => s.symbol === symbol);

        return NextResponse.json({
            success: true,
            data: {
                symbol: globalQuote['01. symbol'],
                name: stockInfo?.name || symbol,
                sector: stockInfo?.sector || 'Unknown',
                price: parseFloat(globalQuote['05. price']),
                change: parseFloat(globalQuote['09. change']),
                changePercent: globalQuote['10. change percent'],
                high: parseFloat(globalQuote['03. high']),
                low: parseFloat(globalQuote['04. low']),
                open: parseFloat(globalQuote['02. open']),
                previousClose: parseFloat(globalQuote['08. previous close']),
                volume: parseInt(globalQuote['06. volume']),
                latestTradingDay: globalQuote['07. latest trading day']
            }
        });

    } catch (error: any) {
        console.error('Stock API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
