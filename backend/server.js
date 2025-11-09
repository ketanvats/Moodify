// --- Safe environment setup ---
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
    console.log("✅ .env loaded locally");
  } catch (err) {
    console.warn("⚠️ dotenv not loaded (production environment)");
  }
}

console.log('--- Checking Environment Variables ---');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Loaded' : 'MISSING');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Loaded' : 'MISSING');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

// --- Imports ---
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const https = require('https');

// --- App & Config ---
const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;

// --- Body parsing ---
app.use(express.json());
app.use(cookieParser());

// --- Dynamic and safe CORS configuration ---
const allowedOrigins = [
  'http://localhost:5173',
  FRONTEND_URL, // main production URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow curl/mobile/no-origin
      if (
        allowedOrigins.includes(origin) ||
        /--moodify-player\.netlify\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      console.warn(`❌ CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// --- Proxy + secure session handling ---
app.set('trust proxy', 1);

// --- Session store setup ---
const sessionSecret = process.env.SESSION_SECRET || 'fallback_secret_for_dev';
const sessionStore = MongoStore.create({
  mongoUrl: MONGO_URI,
  collectionName: 'sessions',
  ttl: 24 * 60 * 60, // 1 day
  autoRemove: 'native',
});

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// --- MongoDB Connection ---
const connectDB = async () => {
  if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }
  try {
    // Add connection options to handle potential timeouts during initial connection
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// --- Mongoose Schemas and Models ---
const songSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  duration: { type: String, required: true },
  playedAt: { type: Date, default: Date.now }, // Add timestamp for expiration
}, { _id: false }); // Don't create default _id for subdocuments

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  songs: [songSchema],
}, { _id: false });

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  displayName: String,
  email: String,
  profilePic: String,
  savedPlaylists: { type: [playlistSchema], default: [] },
  recentlyPlayed: { type: [songSchema], default: [] },
  searchHistory: { type: [String], default: [] },
});
const User = mongoose.model('User', userSchema);

const trendingCacheSchema = new mongoose.Schema({
  regionCode: { type: String, required: true, unique: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});
const TrendingCache = mongoose.model('TrendingCache', trendingCacheSchema);

const searchCacheSchema = new mongoose.Schema({
  query: { type: String, required: true, index: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});
const SearchCache = mongoose.model('SearchCache', searchCacheSchema);

const aiPlaylistCacheSchema = new mongoose.Schema({
  mood: { type: String, required: true, index: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});
const AiPlaylistCache = mongoose.model('AiPlaylistCache', aiPlaylistCacheSchema);
// --- Passport Configuration ---
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`, // Use dynamic backend URL
      proxy: true // Trust the proxy in production (e.g., on Render)
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          // Update user info if it changed (e.g., profile pic)
          user.displayName = profile.displayName;
          user.email = profile.emails[0].value;
          user.profilePic = profile.photos[0].value.replace(/=s\d+.*$/, '=s256-c');
          await user.save();
        } else {
          // Create new user
          user = new User({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            profilePic: profile.photos[0].value.replace(/=s\d+.*$/, '=s256-c'),
          });
          await user.save();
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.googleId); // Store only googleId in the session
});

passport.deserializeUser(async (googleId, done) => {
  try {
    const user = await User.findOne({ googleId: googleId });
    done(null, user); // Attach the full user object to req.user
  } catch (err) {
    done(err, null);
  }
});

// --- Auth Routes ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login-failed` }), // Use dynamic frontend URL
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect(process.env.FRONTEND_URL); // Use dynamic frontend URL
  }
); 

app.get('/api/user', (req, res) => {
  if (req.user) {
    res.json({
      id: req.user.googleId, // Use googleId from our schema
      name: req.user.displayName, // Use displayName from our schema
      email: req.user.email, // Use email from our schema
      profilePic: req.user.profilePic, // Use profilePic from our schema
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/auth/logout', (req, res, next) => {
  req.logout(err => {
    if (err) {
      console.error('Error during logout:', err);
      return next(err);
    }
    req.session.destroy(err => {
      if (err) return res.status(500).json({ message: 'Could not log out, please try again.' });
      res.clearCookie('connect.sid'); // The default session cookie name
      res.status(200).json({ message: 'Logout successful' });
    });
  });
});

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

app.get('/api/me/data', ensureAuthenticated, async (req, res) => {
  try {
    // req.user is populated by deserializeUser with the Mongoose User document
    const user = req.user; 
    if (!user) {
      return res.status(404).json({ error: 'User not found in database.' });
    }
    res.json({
      savedPlaylists: user.savedPlaylists || [],
      recentlyPlayed: user.recentlyPlayed || [],
      searchHistory: user.searchHistory || [],
    });
  } catch (error) {
    console.error("Error fetching user data from MongoDB:", error);
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

app.post('/api/me/data', ensureAuthenticated, async (req, res) => {
  const userId = req.user.googleId; // Use googleId to find the user
  const { savedPlaylists, recentlyPlayed, searchHistory } = req.body;

  try {
    // When updating recentlyPlayed, ensure each song has a `playedAt` timestamp.
    // This handles songs played in the current session.
    const updatedRecentlyPlayed = recentlyPlayed?.map(song => ({
      ...song,
      playedAt: song.playedAt || new Date() // Add timestamp if it's missing
    }));

    const updateFields = {};
    if (savedPlaylists !== undefined) updateFields.savedPlaylists = savedPlaylists;
    if (updatedRecentlyPlayed !== undefined) updateFields.recentlyPlayed = updatedRecentlyPlayed;
    if (searchHistory !== undefined) updateFields.searchHistory = searchHistory;

    // If there's nothing to update, just return.
    if (Object.keys(updateFields).length === 0) {
      return res.status(200).json({ message: 'No data to update.' });
    }

    await User.findOneAndUpdate({ googleId: userId }, { $set: updateFields }, { new: true, upsert: true });
    res.status(200).json({ message: 'Data saved successfully.' });
  } catch (error) {
    console.error("Error saving user data to MongoDB:", error);
    res.status(500).json({ error: 'Failed to save user data.' });
  }
});

// --- Scheduled Job for History Cleanup ---
// Runs once every day at midnight.
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily cleanup job for recently played history...');
  const twentyDaysAgo = new Date();
  twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

  try {
    const result = await User.updateMany(
      { 'recentlyPlayed.playedAt': { $lt: twentyDaysAgo } }, // Find users with old songs
      { $pull: { recentlyPlayed: { playedAt: { $lt: twentyDaysAgo } } } } // Remove those songs
    );
    console.log(`Cleanup complete. Modified ${result.modifiedCount} user documents.`);
  } catch (error) {
    console.error('Error during recently played cleanup cron job:', error);
  }
}, {
  scheduled: true,
  timezone: "UTC" // Use UTC to avoid timezone issues
});




app.get('/api/trending-music', async (req, res) => {
  const { regionCode = 'IN', pageToken } = req.query; // Default to 'IN' if no region is provided
  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API key is not configured.' });
  }

  // If a pageToken is present, it's for infinite scroll, so we bypass the cache.
  // We only cache the first page of results.
  if (!pageToken) {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const cachedData = await TrendingCache.findOne({ 
        regionCode: regionCode,
        createdAt: { $gte: sevenDaysAgo } 
      });

      if (cachedData) {
        console.log(`Serving trending music for region ${regionCode} from cache.`);
        return res.json(cachedData.data);
      }
    } catch (cacheError) {
      console.error("Error reading from trending cache:", cacheError);
      // If cache read fails, proceed to fetch from API but don't block the user.
    }
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails,statistics',
        chart: 'mostPopular',
        regionCode: regionCode, // Use the region code from the query
        videoCategoryId: '10', // '10' is the category ID for Music
        maxResults: 24, // Fetch a good number for a grid layout
        key: YOUTUBE_API_KEY,
        pageToken: pageToken,
      },
    });

    const responseData = {
      items: response.data.items,
      nextPageToken: response.data.nextPageToken,
    };

    // If this was a request for the first page, update the cache.
    if (!pageToken) {
      console.log(`Fetching new trending music for region ${regionCode} and caching.`);
      await TrendingCache.findOneAndUpdate(
        { regionCode: regionCode },
        { data: responseData, createdAt: new Date() },
        { upsert: true, new: true }
      );
    }
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching from YouTube API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch trending music from YouTube.' });
  }
});

app.get('/api/search-music', async (req, res) => {
  const { query, pageToken } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }
  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API key is not configured.' });
  }

  // --- Caching Logic ---
  // Only cache the first page of results. Subsequent pages are fetched live.
  if (!pageToken) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const cachedResult = await SearchCache.findOne({
        query: query,
        createdAt: { $gte: oneDayAgo }
      });

      if (cachedResult) {
        console.log(`Serving search results for query "${query}" from cache.`);
        return res.json(cachedResult.data);
      }
    } catch (cacheError) {
      console.error(`Error reading from search cache for query "${query}":`, cacheError);
    }
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: 24,
        key: YOUTUBE_API_KEY,
        pageToken: pageToken,
      },
    });

    // The search result structure is different from the trending videos one
    // The video ID is in `item.id.videoId`
    const responseData = {
      items: response.data.items,
      nextPageToken: response.data.nextPageToken,
    };

    // If this was a request for the first page, update the cache.
    if (!pageToken) {
      console.log(`Fetching new search results for query "${query}" and caching.`);
      await SearchCache.findOneAndUpdate(
        { query: query },
        { data: responseData, createdAt: new Date() },
        { upsert: true, new: true }
      );
    }
    res.json(responseData);
  } catch (error) {
    console.error('Error searching YouTube API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to search for music on YouTube.' });
  }
});

app.get('/api/lyrics', async (req, res) => {
  const { trackName, artistName } = req.query;

  if (!trackName || !artistName) {
    return res.status(400).json({ error: 'Track name and artist name are required.' });
  }

  try {
    const response = await axios.get('https://lrclib.net/api/get', {
      params: {
        track_name: trackName,
        artist_name: artistName,
      },
    });

    // If lyrics are found, send them back.
    res.json(response.data);
  } catch (error) {
    // lrclib.net returns a 404 error if lyrics are not found, which axios will catch.
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Lyrics not found.' });
    }
    console.error('Error fetching lyrics from Lrclib API:', error.message);
    res.status(500).json({ error: 'Failed to fetch lyrics.' });
  }
});

app.get('/api/generate-playlist', async (req, res) => {
  const { mood } = req.query;

  if (!mood) {
    return res.status(400).json({ error: 'A mood description is required.' });
  }
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key is not configured.' });
  }

  const prompt = `
    Based on the following mood or activity: "${mood}", generate a list of 10 songs. Your response must be a valid JSON array of objects, where each object has "artist" and "title" keys.
    For example: [{"artist": "Daft Punk", "title": "Get Lucky"}, {"artist": "Pharrell Williams", "title": "Happy"}]
  `;

  try {
    // Step 1: Ask OpenAI for a list of songs
    const openAIResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo-1106', // This model is optimized for JSON mode
        messages: [
          {
            role: 'system',
            content: 'You are a helpful playlist assistant designed to output JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const songSuggestions = JSON.parse(openAIResponse.data.choices[0].message.content);

    // Step 2: Search for each song on YouTube
    const youtubeSearchPromises = songSuggestions.map(song =>
      axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: `${song.artist} ${song.title}`,
          type: 'video',
          videoCategoryId: '10',
          maxResults: 1, // Get the top result for each song
          key: YOUTUBE_API_KEY,
        },
      })
    );

    const youtubeSearchResults = await Promise.all(youtubeSearchPromises);

    // Step 3: Format the results and send back to the client
    const playlistItems = youtubeSearchResults
      .map(result => result.data.items[0])
      .filter(item => item); // Filter out any songs that weren't found

    res.json({
      items: playlistItems,
      nextPageToken: null, // No pagination for generated playlists
    });

  } catch (error) {
    console.error('Error generating playlist:', error.response ? error.response.data : error.message);
    if (error.response?.data?.error) {
        console.error('OpenAI API Error Details:', error.response.data.error.message);
    }
    res.status(500).json({ error: 'Failed to generate playlist.' });
  }
});

app.get('/api/generate-playlist-youtube', async (req, res) => {
  const { mood } = req.query;

  if (!mood) {
    return res.status(400).json({ error: 'A mood description is required.' });
  }
  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API key is not configured.' });
  }

  // Construct a search query that is likely to yield good music results
  const searchQuery = `${mood} songs playlist`;

  // --- Caching Logic for AI-generated YouTube search ---
  // We use the same SearchCache, but the key is the mood.
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // We use a specific prefix to avoid collision with regular searches
    const cacheKey = `ai-yt-search:${mood}`; 
    const cachedResult = await SearchCache.findOne({
      query: cacheKey,
      createdAt: { $gte: oneDayAgo }
    });

    if (cachedResult) {
      console.log(`Serving AI YouTube search for mood "${mood}" from cache.`);
      return res.json(cachedResult.data);
    }
  } catch (cacheError) {
    console.error(`Error reading from AI YouTube search cache for mood "${mood}":`, cacheError);
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: 24,
        key: YOUTUBE_API_KEY,
      },
    });

    const responseData = {
      items: response.data.items,
      nextPageToken: response.data.nextPageToken,
    };

    // Update the cache
    const cacheKey = `ai-yt-search:${mood}`;
    console.log(`Fetching new AI YouTube search for mood "${mood}" and caching.`);
    await SearchCache.findOneAndUpdate(
      { query: cacheKey },
      { data: responseData, createdAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(responseData);

  } catch (error) {
    console.error('Error searching YouTube with mood:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate playlist from YouTube search.' });
  }
});

// --- Catch-all for API routes ---
// If a request starts with /api/ but doesn't match any of the above routes,
// send a 404 error. This prevents it from falling through to the frontend catch-all.
app.all(/\/api\/.*/, (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// For local HTTPS development, you might use this:
// const httpsOptions = {
//   key: fs.readFileSync('./localhost-key.pem'),
//   cert: fs.readFileSync('./localhost.pem'),
// };

// --- Serve Frontend ---
// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../build')));

// The "catchall" handler: for any request that doesn't match an API route,
// send back React's index.html file. This must be the last route.
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// https.createServer(httpsOptions, app).listen(PORT, () => {
//   console.log(`Backend server running securely on https://localhost:${PORT}`);
// });

// For deployment, listen directly on the provided PORT
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
  });
});
