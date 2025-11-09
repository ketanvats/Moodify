import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'aos/dist/aos.css'; // Import AOS styles
import { ThemeProvider } from './context/ThemeContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Playlists from './pages/Playlists.tsx';
import History from './pages/History.tsx';
import Home from './pages/Home.tsx';
import PlaylistView from './pages/PlaylistView.tsx';
import About from './pages/About.tsx';
import SearchResults from './pages/SearchResults.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<App />}>
              {/* Add index route for the home page */}
              <Route index element={<Home />} />
              <Route path="search/:query" element={<SearchResults />} />
              <Route path="playlists" element={<Playlists />} />
              <Route path="playlist/:playlistName" element={<PlaylistView />} />
              <Route path="history" element={<History />} />
              <Route path="about" element={<About />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
