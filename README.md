# Topics-Spring25
Repository for **Topics In Computer Science: Web Application Development With Python** for Spring 2025.

# **MUMUNDO: Share Playlists, Discover Music**

## **About MUMUNDO**
MUMUNDO is derived by blending the first two syllables of "music" (mu-) with the Spanish world "mundo" (meaning world), symbolizing a global community connected through music. MUMUNDO is a music-focused platform that helps users grow their online community by sharing Spotify playlists. Connect your Spotify account, select which playlists to share, and explore music curated by real people. With built-in Spotify integration, users can preview tracks directly in the browser and connect with others through a shared love of music.

## **Initalizing MUMUNDO (on Windows)**
Start with creating a virtual environment

```bash
python -m venv venv
.\venv\Scripts\activate
```

Install Node.js (v18 or later recommended)
https://nodejs.org/en

then run the following command to install all required packages listed in package.json

```bash
npm install
```

To access MUMUNDO, run the following commands
```bash
cd mumundo
cd frontend
npm run dev
```

To access MUMUNDO FastAPI, run the following command
```bash
uvicorn mumundo.backend.main:app --reload
```

## **Frontend Setup**
The frontend of MUMUNDO was built with a modern JavaScript stack, including React, a JavaScript library for building user interefaces; Tailwind CSS, a utility-first CSS framework; Vite, a build tool and development server; and Node.js, a JavaScript runtime used for tooling.

### **Main Page**
When the user enters the main page, the user see a visually appealing interface that highlights  MUMUNDO's core features, such as as sharing Spotify playlists and Spotify integration, as well as its overall purpose. To begin using MUMUNDO, users can click the Sign in button location on the top-right hand corner.

![Main Page Screenshot](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/mainpage.PNG)

### **User Sign Up and Login**
When a user clicks the Sign in button, they are redirected to the sign-in page. If the user has already registered an account with MUMUNDO, they can log in by entering their email address and password. Error Prevention has been considered, as both fields are required in order for user to log in; if either is left blank, the message "Please fill out this field" will be displayed. If the user enters an incorrectly formatted email address (such as one missing the @ symbol), a message will appear stating that a valid email must include @.

![User Log In](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/signin.PNG)

As previously mentioned, if the user hasn't register for an account with MUMUNDO, the user will be prompted to sign up for an account. Error prevention protocols have also been placed here.

![User Sign Up](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/signup.PNG)

### **User Profile Page**
Once the user has successfully sign-up/logged in, the user will be redirected to the main page. The user can access the profile page by clicking on Profile on the top center portion of the page. The default profile page has the default MUMUNDO profile picture icon next to the user's username and email, where the user has the option to change the profile picture and add a bio to their profile page. The user also has the option to import Spotify playlists on the profile page, by adding a Spotify Playlist URL to the designated field, and when they click Import Playlist, the playlist will appear below under Your Playlists.

![User Profile Edit](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/editprofile.PNG)

![User Main Profile Page](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/profile.PNG)

### **Spotify Playlists**
When a user imports a playlist, they have the option of making their playlist private or public to users. The user is also able to view playlists, thumbs up/downs a playlist, and also report a playlist.

![Your Playlists](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/yourplaylists.PNG)

![View Playlist](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/viewplaylists.PNG)

![Report Playlist](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/reportplaylists.PNG)

Users can also view shared playlists (playlists that other users have shared publically) by clicking on the Shared Playlists button at the top center portion of the screen.

![Report Playlist](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/sharedplaylists.PNG)

### **MUMUNDO Admin Features**
A user is considered an admin on MUMUNDO if they have a red Administrator tag on the top of their MUMUNDO screen. Admins have the ability to view reported playlists and delete other users' playlists.

![Reported Playlists](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/reportedplaylists.PNG)

![Delete Playlists](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/deleteplaylists.PNG)


## **Backend Setup**
The backend of MUMUNDO was built with FastAPI. It features a MongoDB-backed data layer with models like `User` and `Song`, and includes API routes for authentication (`CoreAuth.py`), user profiles (`profile.py`), music data (`music.py`), admin tools (`admin.py`), and Spotify playlist integration (`spotify_integration.py`). The backend supports static file uploads, centralized logging via `Logger.py`, and database intialization with `MongoHandler.py`.

## **MongoDB Database**
The database consists of the following collections:
### MainDB

1. **`users` Collection:**
   - Fields: `_id`, `email`, `username`, `hashed_password`, `profile_picture`, `created_at`, `bio`, `is_admin`

### SpotifyDB

2. **`playlist` Collection:**
   - Fields: `_id`, `Title`, `User`, `Song`, `spotify_id`, `IsPublic`, `created_at`, `image_url`, `Likes`, `Dislikes`, `Saves`, `Total_Time`

3. **`playlist_ratings` Collection:**
   - Fields: `_id`, `playlist_id`, `user_id`, `type`, `created_at`

4. **`song` Collection:**
   - Fields: `_id`, `Title`, `Artist`, `Album`, `Length`, `spotify_id`, `preview_url`, `image_url`

### LogsDB

5. **`application_logs` Collection:**
   - Fields: `_id`, `timestamp`, `level`, `logger`, `message`
  
![MongoDB Database](https://raw.githubusercontent.com/JP-N/Topics-Spring25-Final-Project/main/mumundo/demoscreenshots/mongodb.PNG)

## Tests
The following unit testing files were implemented:
- test_user.py
- test_main.py
- config_test.py
