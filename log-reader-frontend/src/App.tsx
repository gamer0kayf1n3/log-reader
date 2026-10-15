import './App.css'
import { useEffect, useState, useMemo } from 'react'
import JoinLeave from './components/JoinLeave.tsx'
import Chat from './components/Chat.tsx'
import Advancement from './components/Advancement.tsx'

function dealWithTextInChunks(text: string, onProgress: (partialData: any[]) => void, onComplete: () => void) {
  const lines = text.split('\n');
  let lineIndex = 0;
  let globalItemIndex = 0;
  const chunkSize = 5000;

  function processChunk() {
    const chunkResult = [];
    const endIndex = Math.min(lineIndex + chunkSize, lines.length);

    for (let i = lineIndex; i < endIndex; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const parts = line.split(/(?<!\\),/);
      if (parts.length < 5) {
        continue;
      }
      const [type, date, time, player, message] = parts;
      const dateTime = new Date(`${date}T${time}Z`);
      
      chunkResult.push({ 
        type, 
        dateTime, 
        player, 
        message, 
        originalIndex: globalItemIndex++ 
      });
    }

    onProgress(chunkResult);
    lineIndex = endIndex;

    if (lineIndex < lines.length) {
      setTimeout(processChunk, 0);
    } else {
      onComplete();
    }
  }

  processChunk();
}

function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressText, setProgressText] = useState('Fetching log file...');
  
  // Read initial URL params once
  const initialParams = new URLSearchParams(window.location.search);
  const initialSearch = initialParams.get('search') || '';

  // Local input value for snappy typing without lag
  const [inputValue, setInputValue] = useState<string>(initialSearch);
  
  // Debounced search query that actually triggers filtering and URL updates
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);

  const [currentPage, setCurrentPage] = useState<number>(() => {
    const pageParam = parseInt(initialParams.get('page') || '1', 10);
    return isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  });
  
  const itemsPerPage = 200;

  // Debounce effect: updates searchQuery 300ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
      setCurrentPage(1); // Reset to page 1 on search change
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    let cancelled = false;
    const logUrl = `${import.meta.env.BASE_URL}chat-log.bin`;

    fetch(logUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => {
        setProgressText('Decompressing log file...');
        const stream = new Response(arrayBuffer).body?.pipeThrough(new DecompressionStream('gzip'));
        if (!stream) throw new Error('Failed to create decompression stream.');
        return new Response(stream).text();
      })
      .then((text) => {
        if (cancelled) return;
        setProgressText('Parsing logs...');
        setData([]);

        dealWithTextInChunks(
          text,
          (partialChunk) => {
            if (!cancelled) {
              setData((prev) => [...prev, ...partialChunk]);
            }
          },
          () => {
            if (!cancelled) setLoading(false);
          }
        );
      })
      .catch((error) => {
        console.error('Error fetching, decompressing, or parsing the file:', error);
        if (!cancelled) setProgressText('Error loading logs. Check console.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) => item.message.toLowerCase().includes(query) || item.player.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  useEffect(() => {
    if (!loading && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage, loading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (currentPage === 1) params.delete('page');
    else params.set('page', currentPage.toString());

    if (!searchQuery.trim()) params.delete('search');
    else params.set('search', searchQuery);
    
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
    window.history.pushState({}, '', newUrl);
  }, [currentPage, searchQuery]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pageParam = parseInt(params.get('page') || '1', 10);
      const searchParam = params.get('search') || '';
      
      setCurrentPage(isNaN(pageParam) || pageParam < 1 ? 1 : pageParam);
      setInputValue(searchParam);
      setSearchQuery(searchParam);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const goToNextPage = () => { setCurrentPage((prev) => Math.min(prev + 1, totalPages)); jumpToTop(); };
  const goToPrevPage = () => { setCurrentPage((prev) => Math.max(prev - 1, 1)); jumpToTop(); };
  const jumpToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClearSearch = () => {
    setInputValue('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <>
      <div className="App">
        <h1>Minecraft Iskord Logs</h1>
        
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search logs..."
            value={inputValue}
            onChange={handleSearchChange}
          />
          {inputValue && (
            <button 
              className="clear-search-btn"
              onClick={handleClearSearch} 
            >
              Clear
            </button>
          )}
        </div>

        {loading && <p className="loading-indicator">{progressText} ({data.length} lines loaded so far...)</p>}

        {!loading && (
          <div className="pagination-controls">
            <button onClick={goToPrevPage} disabled={currentPage === 1}>Previous</button>
            <span id="top">
              Page {currentPage} of {totalPages} ({filteredData.length} matching entries)
            </span>
            <button onClick={goToNextPage} disabled={currentPage >= totalPages}>Next</button>
          </div>
        )}

        <div className="chatContent">
          {
            visibleData.map((item, index) => {
              const absoluteIndex = startIndex + index;
              const prevMsg = absoluteIndex > 0 ? filteredData[absoluteIndex - 1] : null;

              const targetIdx = item.originalIndex ?? absoluteIndex;

              if (item.type === "0") return <JoinLeave key={targetIdx} prev={prevMsg} data={item} itemsPerPage={itemsPerPage} idx={targetIdx} />
              if (item.type === "1") return <Chat key={targetIdx} prev={prevMsg} data={item} itemsPerPage={itemsPerPage} idx={targetIdx} />
              if (item.type === "2") return <Advancement key={targetIdx} prev={prevMsg} data={item} itemsPerPage={itemsPerPage} idx={targetIdx} />
              return null;
            })
          }
        </div>

        {!loading && filteredData.length > 0 && (
          <div className="pagination-controls">
            <button onClick={goToPrevPage} disabled={currentPage === 1}>Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={goToNextPage} disabled={currentPage >= totalPages}>Next</button>
          </div>
        )}
      </div>
      <span>For internal use of Straight Up Not Straight (SUNS) Group. All rights reserved. <a href="https://f1n3.xyz">gamer0kayf1n3</a> (C)</span>
    </>
  )
}

export default App