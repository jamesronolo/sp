/**
 * ============================================================================
 * 🔧 CONFIGURATION FILE — PERSONALIZATION SETTINGS
 * ============================================================================
 * 
 * You only need to edit this file to personalize the surprise website!
 * Modify the partner name, anniversary date, love notes, or media list.
 */

const CONFIG = {
  // 💖 HER NAME: Displayed in the hero title as "for <partnerName>"
  partnerName: "Lyka Macabudbud",

  // 🌹 HERO HEADINGS & ROMANTIC SUBTITLE
  heroTitlePrefix: "Forever & Always",
  heroSubtitle: "Falling deeper in love with you with every breath, every second, and every memory we share.",

  // 🌧️ FALLING RAIN SETTINGS
  // rainLanes: Dedicated non-overlapping columns across the screen (desktop)
  rainLanes: 5,
  // rainDuration: Slow, gentle romantic fall speed (in seconds)
  rainDuration: 16,

  // 🌹 FALLING LOVE EMOJIS RAIN SETTINGS
  // Set to true to enable falling love-themed emojis (roses, hearts, petals)
  enableFallingEmojis: true,
  // Emojis that gently shower down alongside the memory photos
  fallingEmojis: [
    '🌹', '💖', '🌸', '💕', '🌷', '💓', '💐', '🤍', '🌺', '💘', '💝'
  ],
  // Number of simultaneous falling emojis across the screen
  fallingEmojiCount: 24,
  
  // 🎵 PLAYLIST & MUSIC SETTINGS
  // Set to true to enable music controls and background soundtrack
  enableMusic: true,
  // Auto-play music on the user's first click anywhere on the page
  autoPlayOnFirstClick: true,
  // Default starting track index (0 = first song: "Teka Lang")
  defaultTrackIndex: 0,
  // Romantic & Ex Battalion songs with custom cover images from your assets
  playlist: [
    {
      id: "track-1",
      title: "Fallin",
      artist: "Ex Battalion",
      src: "assets/audio/Ex Battalion - Fallin (Lyrics).mp3",
      cover: "assets/images/image7.jpg"
    },
    {
      id: "track-2",
      title: "Follow My Lead",
      artist: "Ex Battalion ft. Chicser & Sachzna",
      src: "assets/audio/Ex Battalion - Follow My Lead ft. Chicser Sachzna Laparan.mp3",
      cover: "assets/images/image8.jpg"
    },
    {
      id: "track-3",
      title: "Aagawin",
      artist: "Ex Battalion",
      src: "assets/audio/ExBattalion - Aagawin (Lyrics) everyone exbatallion.mp3",
      cover: "assets/images/image9.jpg"
    },
    {
      id: "track-4",
      title: "No Games",
      artist: "Ex Battalion ft. King Badger & Skusta Clee",
      src: "assets/audio/No Games - Ex Battalion ft. King Badger ✘ Skusta Clee Lyrics [737aYtUaNM0].mp3",
      cover: "assets/images/image10.jpg"
    },
    {
      id: "track-5",
      title: "Tell Me",
      artist: "Ex Battalion",
      src: "assets/audio/Tell Me - Ex Battalion (Lyric Video).mp3",
      cover: "assets/images/image11.jpg"
    },
    {
      id: "track-6",
      title: "Follow My Lead (Alternative)",
      artist: "Ex Battalion ft. Chicser & Sachzna",
      src: "assets/audio/Ex Battalion - Follow My Lead ft. Chicser Sachzna Laparan (1).mp3",
      cover: "assets/images/image12.jpg"
    },
    {
      id: "track-7",
      title: "Teka Lang",
      artist: "EMMAN",
      src: "assets/audio/EMMAN - Teka Lang (Official Lyric Video).mp3",
      cover: "assets/images/image1.jpg"
    },
    {
      id: "track-8",
      title: "Hirap Kalimutan",
      artist: "Acoustic / Lyric",
      src: "assets/audio/Hirap Kalimutan (Official Lyric Video).mp3",
      cover: "assets/images/image2.jpg"
    },
    {
      id: "track-9",
      title: "Ikaw at Ako",
      artist: "Johnoy Danao",
      src: "assets/audio/Johnoy Danao - Ikaw at Ako (official music video).mp3",
      cover: "assets/images/image3.jpg"
    },
    {
      id: "track-10",
      title: "Libu-Libong Buwan (Uuwian)",
      artist: "Kyle Raphael",
      src: "assets/audio/Libu-Libong Buwan (Uuwian) - Kyle Raphael (Official Music Video).mp3",
      cover: "assets/images/image4.jpg"
    },
    {
      id: "track-11",
      title: "Lalim",
      artist: "MATÉO",
      src: "assets/audio/MATÉO - Lalim (Official Lyric Video with Chords).mp3",
      cover: "assets/images/image5.jpg"
    },
    {
      id: "track-12",
      title: "Panaginip",
      artist: "nicole",
      src: "assets/audio/Panaginip - nicole (Official Music Video) (1).mp3",
      cover: "assets/images/image6.jpg"
    }
  ],
  // Fallback single path for backwards compatibility
  musicSrc: "assets/audio/Ex Battalion - Fallin (Lyrics).mp3",

  // 📸 MEDIA COLLECTION (Images & Videos)
  // Each entry supports:
  // - type: "image" or "video"
  // - src: path to the file inside assets/
  // - caption: sweet message or title shown in the preview modal
  media: [
    { type: "image", src: "assets/images/image1.jpg", caption: "Sweet smiles & endless sunshine" },
    { type: "image", src: "assets/images/image2.jpg", caption: "Every adventure is better with you" },
    { type: "video", src: "assets/videos/vid1.mp4", caption: "That laugh I could listen to forever" },
    { type: "image", src: "assets/images/image3.jpg", caption: "My favorite place is right beside you" },
    { type: "image", src: "assets/images/image4.jpg", caption: "Unforgettable little moments" },
    { type: "video", src: "assets/videos/vid2.mp4", caption: "Caught in the sweetest moment with you" },
    { type: "image", src: "assets/images/image5.jpg", caption: "You make ordinary days extraordinary" },
    { type: "image", src: "assets/images/image6.jpg", caption: "Treasured memories together" },
    { type: "image", src: "assets/images/image7.jpg", caption: "Golden hour and your golden heart" },
    { type: "video", src: "assets/videos/vid3.mp4", caption: "Pure joy whenever you're near" },
    { type: "image", src: "assets/images/image8.jpg", caption: "Forever grateful for your warmth" },
    { type: "image", src: "assets/images/image9.jpg", caption: "You and me against the world" },
    { type: "image", src: "assets/images/image10.jpg", caption: "Still giving me butterflies every day" },
    { type: "image", src: "assets/images/image11.jpg", caption: "My heart found its true home in you" },
    { type: "image", src: "assets/images/image12.jpg", caption: "To a lifetime of holding hands" },
    { type: "image", src: "assets/images/image13.jpg", caption: "Always & forever, with all my love" }
  ],

  // 💌 FLOATING "NOTE" BUTTON MESSAGE (Shown when tapping the floating Note button)
  floatingNote: {
    greeting: "Lyka 💖",
    text: "dili manglood kay sayang ka gwapa HAHAHAH",
    author: "JR "
  },

  // 💌 LOVE NOTES: Shown in the keepsake cards
  notes: [
    {
      text: "Every hour you invest now, even in first year, is a step closer to walking across that stage as a cum laude graduate.",
      author: "Stephen Hawking"
    },
    "You are my favorite thought every morning and my sweetest dream every night. 💫",
    "No matter where life takes us, holding your hand makes everywhere feel like home. 🏡",
    "If I had to live my life all over again, I would find you sooner so I could love you longer. ⏳",
    "Your smile is my daily dose of happiness. Never stop shining your beautiful light. ✨",
    "Thank you for being my best friend, my greatest adventure, and my deepest love. 🌹",
    "I love you more than all the stars in the night sky, today and all of our tomorrows. 🌌",
    "Every little moment with you is etched forever into my happiest memories. 📸",
    "You make my heart skip a beat and feel completely safe, all at the exact same time. 💓",
    "I fell in love with your laugh, your kindness, and the radiant soul you are. 💖",
    "Being loved by you is the greatest privilege of my life. Happy anniversary, my love! 🥂"
  ]
};

// Make config globally available
window.CONFIG = CONFIG;
