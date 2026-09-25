# "For You" — Interactive Surprise Page 💖

An interactive single-page gift website built with pure **HTML, CSS, and JavaScript** (no frameworks, no build tools, no npm installs required).

---

## ✨ Features

- 🌧️ **Endless Falling Memory Rain**: Your photos and videos drift gracefully down the screen in independent lanes, continuously looping.
- ⏸️ **Instant Freeze & Lightbox**: Tapping or clicking any falling item freezes every lane immediately mid-air and opens the memory in a rich, high-resolution modal. Closing it resumes the rain seamlessly from where it left off.
- ⏳ **Live "Together Since" Counter**: Live real-time counter displaying days, hours, minutes, and seconds spent together.
- 🖼️ **Static Gallery Grid**: A responsive gallery below the fold with category filtering (All, Photos, Videos).
- 💌 **Floating Love Notes**: A floating interactive envelope button that reveals randomized sweet love notes with a heart burst animation.
- 🎵 **Background Music Player**: Toggleable ambient music player with smart romantic Web Audio synthesizer fallback when no mp3 is loaded.
- 📱 **Fully Responsive**: Optimized for phones, tablets, and wide desktop displays.
- ♿ **Accessible**: Full keyboard navigation (`Escape`, Arrow keys) and respects `prefers-reduced-motion`.

---

## 📁 Project Structure

```
.
├── index.html              # The main page
├── css/
│   └── style.css           # Styling, animations, glassmorphism, responsive grid
├── js/
│   ├── config.js           # 🔧 EDIT THIS — your names, date, photos, notes
│   └── script.js           # Core interactive logic (rain, modal, counter, audio)
├── assets/
│   ├── images/             # Your photos (.jpg, .png, etc.)
│   ├── videos/             # Your video clips (.mp4)
│   └── audio/              # Optional background song (song.mp3)
├── .gitignore
└── README.md
```

---

## 🔧 Personalization

You only need to edit **`js/config.js`**!

| Field | Description |
|---|---|
| `partnerName` | Displayed as "for **\<partnerName\>**" in the hero title |
| `sinceDate` | Start date for the together counter (format `YYYY-MM-DD`) |
| `notes` | Array of love messages displayed when the 💌 button is tapped |
| `rainLanes` | Number of simultaneous falling lanes (default: 6) |
| `enableMusic` | `true`/`false` to show or hide the music button |
| `musicSrc` | Path to background audio file (`assets/audio/song.mp3`) |
| `media` | List of photos and videos with captions |

---

## 🚀 How to Run Locally

Double-click `index.html` in your file explorer to open it directly in any web browser, or serve it with any local static server.

---

## 🌐 Deploy to GitHub Pages

1. In the project folder, commit and push to your GitHub repository:
   ```bash
   git add .
   git commit -m "Build For You interactive surprise page"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. On GitHub, navigate to **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, choose branch `main`, folder `/ (root)`, and click **Save**.
4. In a moment, your live link will be ready: `https://<your-username>.github.io/<repo-name>/`!
