# Spotify Scheduled Dynamic Playlist Shuffler

A Spotify Playlist Shuffler that runs scheduled in the background with a process. By fetching recently listened tracks, saving last shuffled tracks the application can assign weights to tracks and ensure a good shuffle.

## Packages & Technologies Used
- **Nest.js** – A progressive Node.js framework for building scalable server-side applications.  
- **Spotify Web API** – An interface to interact with Spotify data, such as playlists, tracks, and user information.  
- **OAuth2 Authorization Code Flow** – A secure authentication method that allows the app to access user data without exposing credentials.  
- **NPM LowDB Flat File DB** – A lightweight, JSON-based database for storing data locally without requiring a full database server.  
- **PM2 Package Manager 2** - A process manager for Node.js applications that enables automatic startup and background execution using a batch script and cron scheduling.
