"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
`;

// ─── CryptoPunk Pixel Art Generator ───────────────────────────────────────────
// Seeded pseudo-random so each creator always gets the same punk
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

// Skin tone palettes
const SKIN_TONES = [
  ["#FFDBB4", "#E8A87C", "#C47A3A"],  // light
  ["#F1C27D", "#D4956A", "#A0522D"],  // medium-light
  ["#C68642", "#A0522D", "#7B3F00"],  // medium
  ["#8D5524", "#6B3F21", "#4A2912"],  // dark
  ["#FFD700", "#DAA520", "#B8860B"],  // gold punk
  ["#7FFFD4", "#48D1CC", "#20B2AA"],  // alien (teal)
  ["#98FB98", "#3CB371", "#2E8B57"],  // zombie (green)
];

// Background palettes — dark, crypto-vibe
const BG_PALETTES = [
  "#0D1B2A", "#1A0A2E", "#0A1A0F", "#1F0A0A", "#0A0A1F",
  "#0E1320", "#150A1E", "#0A1510", "#1A1200", "#0F0F1A",
];

// Hair styles encoded as pixel masks (8x3 top section, row by row)
const HAIR_STYLES = [
  // Mohawk
  [[0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,0,0,1,1,0,0,0]],
  // Long hair
  [[1,1,1,1,1,1,1,1],[1,1,0,0,0,0,1,1],[1,0,0,0,0,0,0,1]],
  // Cap flat
  [[0,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0]],
  // Wild spikes
  [[1,0,1,0,1,0,1,0],[0,1,1,1,1,1,1,0],[0,0,1,1,1,1,0,0]],
  // Bald top
  [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]],
  // Side sweep
  [[1,1,1,1,0,0,0,0],[1,1,1,1,1,0,0,0],[0,1,1,0,0,0,0,0]],
  // Afro
  [[0,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1],[1,1,1,0,0,1,1,1]],
];

const HAIR_COLORS = [
  "#F5C842","#FF6B6B","#64FFDA","#A78BFA","#FB923C",
  "#F0F0F0","#1A1A1A","#8B4513","#DC143C","#00CED1",
];

// Accessories
const ACCESSORIES = [
  null, // none
  "glasses", "sunglasses", "vr_headset", "monocle",
];

// Mouth styles
const MOUTH_STYLES = ["smile", "smirk", "straight", "frown", "open"];

// Extras
const EXTRAS = [null, null, null, "earring", "nose_ring", "scar"];

function PunkAvatar({ seed, size = 44 }) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const px = 8; // pixel size (8x8 grid = 64px logical, scaled)
    const gridSize = 8;
    const rng = seededRng(hashStr(seed));
    const r = () => rng();

    const skinSet = SKIN_TONES[Math.floor(r() * SKIN_TONES.length)];
    const skin = skinSet[0];
    const skinDark = skinSet[1];
    const skinDarker = skinSet[2];
    const bg = BG_PALETTES[Math.floor(r() * BG_PALETTES.length)];
    const hairStyle = HAIR_STYLES[Math.floor(r() * HAIR_STYLES.length)];
    const hairColor = HAIR_COLORS[Math.floor(r() * HAIR_COLORS.length)];
    const accessory = ACCESSORIES[Math.floor(r() * ACCESSORIES.length)];
    const mouthStyle = MOUTH_STYLES[Math.floor(r() * MOUTH_STYLES.length)];
    const extra = EXTRAS[Math.floor(r() * EXTRAS.length)];
    const eyeColor = ["#00D9FF","#A78BFA","#FF6B6B","#34D399","#F5C842","#FB923C"][Math.floor(r() * 6)];

    // Scale canvas to desired display size
    const scale = size / (gridSize * px) * px; // pixels per grid cell at output size
    const cellSize = size / gridSize;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const fillCell = (col, row, color) => {
      if (col < 0 || col >= gridSize || row < 0 || row >= gridSize) return;
      ctx.fillStyle = color;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    };

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Face base (rows 3-7, cols 1-6)
    const faceRows = [3, 4, 5, 6, 7];
    const faceCols = [1, 2, 3, 4, 5, 6];
    faceRows.forEach(row => faceCols.forEach(col => fillCell(col, row, skin)));

    // Face shading (right side)
    [3,4,5,6].forEach(row => fillCell(6, row, skinDark));
    [5,6].forEach(row => fillCell(5, row, skinDark));

    // Hair (rows 0-2)
    hairStyle.forEach((rowMask, ri) => {
      rowMask.forEach((on, ci) => {
        if (on) fillCell(ci, ri, hairColor);
      });
    });
    // Hair sides (row 3-4 at edges)
    if (hairStyle[2].some(Boolean)) {
      fillCell(1, 3, hairColor);
      fillCell(6, 3, hairColor);
    }

    // Eyes (row 4)
    fillCell(2, 4, "#111");
    fillCell(5, 4, "#111");
    fillCell(2, 4, eyeColor); // iris
    fillCell(5, 4, eyeColor);
    // Eye whites
    ctx.fillStyle = "#fff";
    ctx.fillRect(2 * cellSize, 4 * cellSize, cellSize * 0.4, cellSize * 0.4);
    ctx.fillRect(5 * cellSize, 4 * cellSize, cellSize * 0.4, cellSize * 0.4);

    // Eyebrows (row 3)
    fillCell(2, 3, hairColor);
    fillCell(3, 3, hairColor);
    fillCell(5, 3, hairColor);

    // Nose (row 5)
    fillCell(3, 5, skinDark);
    fillCell(4, 5, skinDark);

    // Mouth (row 6)
    if (mouthStyle === "smile") {
      fillCell(2, 6, skinDarker);
      fillCell(3, 6, "#8B0000");
      fillCell(4, 6, "#8B0000");
      fillCell(5, 6, skinDarker);
    } else if (mouthStyle === "smirk") {
      fillCell(3, 6, "#8B0000");
      fillCell(4, 6, "#8B0000");
      fillCell(5, 6, skinDarker);
    } else if (mouthStyle === "straight") {
      fillCell(2, 6, skinDark);
      fillCell(3, 6, "#5A0000");
      fillCell(4, 6, "#5A0000");
      fillCell(5, 6, skinDark);
    } else if (mouthStyle === "frown") {
      fillCell(2, 6, skinDarker);
      fillCell(3, 6, "#6B0000");
      fillCell(4, 6, "#6B0000");
      fillCell(5, 6, skinDarker);
    } else {
      fillCell(3, 6, "#5A0000");
      fillCell(4, 6, "#000");
      fillCell(5, 6, "#5A0000");
    }

    // Accessories
    if (accessory === "glasses") {
      ctx.strokeStyle = "#888";
      ctx.lineWidth = cellSize * 0.15;
      ctx.strokeRect(1.6 * cellSize, 3.6 * cellSize, cellSize * 1.4, cellSize * 0.8);
      ctx.strokeRect(4.0 * cellSize, 3.6 * cellSize, cellSize * 1.4, cellSize * 0.8);
      ctx.beginPath();
      ctx.moveTo(3.0 * cellSize, 3.9 * cellSize);
      ctx.lineTo(4.0 * cellSize, 3.9 * cellSize);
      ctx.stroke();
    } else if (accessory === "sunglasses") {
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(1.5 * cellSize, 3.5 * cellSize, 1.6 * cellSize, cellSize * 0.8);
      ctx.fillRect(4.0 * cellSize, 3.5 * cellSize, 1.6 * cellSize, cellSize * 0.8);
      ctx.fillStyle = "#555";
      ctx.fillRect(3.1 * cellSize, 3.7 * cellSize, 0.9 * cellSize, 0.3 * cellSize);
    } else if (accessory === "vr_headset") {
      ctx.fillStyle = "#1A1A2E";
      ctx.fillRect(1.2 * cellSize, 3.3 * cellSize, 5.5 * cellSize, 1.2 * cellSize);
      ctx.fillStyle = "#F5C842";
      ctx.fillRect(1.4 * cellSize, 3.5 * cellSize, 2 * cellSize, 0.8 * cellSize);
      ctx.fillRect(4.5 * cellSize, 3.5 * cellSize, 2 * cellSize, 0.8 * cellSize);
    } else if (accessory === "monocle") {
      ctx.strokeStyle = "#DAA520";
      ctx.lineWidth = cellSize * 0.2;
      ctx.beginPath();
      ctx.arc(2.5 * cellSize, 4.1 * cellSize, 0.65 * cellSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Extras
    if (extra === "earring") {
      ctx.fillStyle = "#F5C842";
      ctx.beginPath();
      ctx.arc(1.2 * cellSize, 5 * cellSize, 0.2 * cellSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (extra === "nose_ring") {
      ctx.strokeStyle = "#C0C0C0";
      ctx.lineWidth = cellSize * 0.12;
      ctx.beginPath();
      ctx.arc(3.8 * cellSize, 5.5 * cellSize, 0.25 * cellSize, 0, Math.PI * 2);
      ctx.stroke();
    } else if (extra === "scar") {
      ctx.strokeStyle = "#8B0000";
      ctx.lineWidth = cellSize * 0.15;
      ctx.beginPath();
      ctx.moveTo(5.2 * cellSize, 3.8 * cellSize);
      ctx.lineTo(5.5 * cellSize, 5.2 * cellSize);
      ctx.stroke();
    }

    // Neck (row 7)
    fillCell(3, 7, skin);
    fillCell(4, 7, skin);

    // Pixel outline/border effect
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 0.5;
    for (let c = 0; c < gridSize; c++) {
      for (let rr = 0; rr < gridSize; rr++) {
        ctx.strokeRect(c * cellSize, rr * cellSize, cellSize, cellSize);
      }
    }
  }, [seed, size]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: "4px",
        imageRendering: "pixelated",
        flexShrink: 0,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    />
  );
}
// ──────────────────────────────────────────────────────────────────────────────


const CREATORS = [
  { id: 1, handle: "@Jampzey", name: "Jampzey", followers: 118000, monthlyViews: 5700000, tier: "Premium", niche: ["DeFi", "Alpha"], pricePerPost: 420, engagementRate: 5.8, avatar: "J", country: "US", verified: true },
  { id: 2, handle: "@Hydraze420", name: "Hydraze", followers: 133000, monthlyViews: 1200000, tier: "Premium", niche: ["NFT", "Gaming"], pricePerPost: 380, engagementRate: 4.2, avatar: "H", country: "UK", verified: true },
  { id: 3, handle: "@CryptoUsopp", name: "Usopp", followers: 47000, monthlyViews: 5200000, tier: "Premium", niche: ["Alpha", "Trading"], pricePerPost: 350, engagementRate: 6.1, avatar: "U", country: "SG", verified: true },
  { id: 4, handle: "@ashen_one", name: "Ashen", followers: 46500, monthlyViews: 3200000, tier: "Premium", niche: ["DeFi", "L2"], pricePerPost: 290, engagementRate: 5.3, avatar: "A", country: "AU", verified: true },
  { id: 5, handle: "@defi_scribbler", name: "Scribbler", followers: 18900, monthlyViews: 4000000, tier: "Premium", niche: ["DeFi", "Research"], pricePerPost: 260, engagementRate: 7.2, avatar: "S", country: "TH", verified: true },
  { id: 6, handle: "@zaimiriQ", name: "Zaimiri", followers: 54800, monthlyViews: 1800000, tier: "Premium", niche: ["Web3", "Gaming"], pricePerPost: 310, engagementRate: 4.8, avatar: "Z", country: "MY", verified: true },
  { id: 7, handle: "@BawsaXBT", name: "Bawsa", followers: 32600, monthlyViews: 1600000, tier: "Premium", niche: ["Trading", "Alpha"], pricePerPost: 240, engagementRate: 5.0, avatar: "B", country: "AE", verified: false },
  { id: 8, handle: "@grebbycrypto", name: "Grebby", followers: 51000, monthlyViews: 1300000, tier: "Standard", niche: ["NFT", "Alpha"], pricePerPost: 180, engagementRate: 3.9, avatar: "G", country: "US", verified: false },
  { id: 9, handle: "@abgweb3", name: "ABG", followers: 87500, monthlyViews: 700000, tier: "Standard", niche: ["Web3", "VC"], pricePerPost: 150, engagementRate: 2.8, avatar: "A", country: "IN", verified: false },
  { id: 10, handle: "@iagosnews", name: "Royale", followers: 38500, monthlyViews: 600000, tier: "Standard", niche: ["News", "DeFi"], pricePerPost: 120, engagementRate: 3.1, avatar: "R", country: "BR", verified: false },
  { id: 11, handle: "@thekuchh", name: "Kuch", followers: 51000, monthlyViews: 630000, tier: "Standard", niche: ["Trading", "Web3"], pricePerPost: 130, engagementRate: 3.4, avatar: "K", country: "PK", verified: false },
  { id: 12, handle: "@0xleegenz", name: "le.hl", followers: 9200, monthlyViews: 2900000, tier: "Standard", niche: ["Alpha", "Memes"], pricePerPost: 200, engagementRate: 8.1, avatar: "L", country: "TH", verified: false },
  { id: 13, handle: "@BriggsOnchain", name: "Briggs", followers: 4700, monthlyViews: 2000000, tier: "Standard", niche: ["DeFi", "Research"], pricePerPost: 180, engagementRate: 9.3, avatar: "B", country: "NG", verified: false },
  { id: 14, handle: "@madiweb3", name: "Madi", followers: 2800, monthlyViews: 400000, tier: "Standard", niche: ["Web3", "NFT"], pricePerPost: 80, engagementRate: 4.5, avatar: "M", country: "TH", verified: false },
  { id: 15, handle: "@amit0xic", name: "t0xic", followers: 15200, monthlyViews: 1400000, tier: "Standard", niche: ["DeFi", "Alpha"], pricePerPost: 160, engagementRate: 6.2, avatar: "T", country: "IN", verified: false },
];

const NICHES = ["All", "DeFi", "NFT", "Trading", "Alpha", "Gaming", "Web3", "Research", "News", "Memes", "VC", "L2"];
const TIERS = ["All", "Premium", "Standard"];
const COUNTRIES = ["All", "US", "UK", "SG", "AU", "TH", "MY", "AE", "IN", "BR", "PK", "NG"];

const formatNum = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n;
};

const TIER_COLORS = { Premium: "#F5C842", Standard: "#64FFDA" };
const NICHE_COLORS = {
  DeFi: "#00D9FF", NFT: "#FF6B6B", Trading: "#A78BFA", Alpha: "#F5C842",
  Gaming: "#34D399", Web3: "#FB923C", Research: "#60A5FA", News: "#F472B6",
  Memes: "#FBBF24", VC: "#C084FC", L2: "#2DD4BF",
};

export default function App() {
  const [view, setView] = useState("marketplace"); // marketplace | campaign | dashboard
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [filterNiche, setFilterNiche] = useState("All");
  const [filterTier, setFilterTier] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [sortBy, setSortBy] = useState("monthlyViews");
  const [searchQuery, setSearchQuery] = useState("");
  const [campaignStep, setCampaignStep] = useState(1);
  const [brief, setBrief] = useState({ name: "", goal: "", budget: "", timeline: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [hoveredCreator, setHoveredCreator] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filtered = CREATORS
    .filter(c => {
      if (filterNiche !== "All" && !c.niche.includes(filterNiche)) return false;
      if (filterTier !== "All" && c.tier !== filterTier) return false;
      if (filterCountry !== "All" && c.country !== filterCountry) return false;
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.handle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const toggleCreator = (creator) => {
    setSelectedCreators(prev =>
      prev.find(c => c.id === creator.id)
        ? prev.filter(c => c.id !== creator.id)
        : [...prev, creator]
    );
  };

  const totalBudget = selectedCreators.reduce((s, c) => s + c.pricePerPost, 0);
  const totalReach = selectedCreators.reduce((s, c) => s + c.monthlyViews, 0);

  const styles = {
    app: {
      fontFamily: "'Syne', sans-serif",
      background: "#080B12",
      minHeight: "100vh",
      color: "#E8EAF0",
      overflowX: "hidden",
    },
    nav: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      height: "60px",
      borderBottom: "1px solid #1A1F2E",
      position: "sticky",
      top: 0,
      background: "rgba(8,11,18,0.95)",
      backdropFilter: "blur(12px)",
      zIndex: 100,
    },
    logo: {
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: "20px",
      letterSpacing: "-0.5px",
      color: "#F5C842",
      cursor: "pointer",
    },
    navLinks: {
      display: "flex",
      gap: "4px",
      alignItems: "center",
    },
    navLink: (active) => ({
      padding: "6px 16px",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      border: "none",
      background: active ? "#1A2035" : "transparent",
      color: active ? "#F5C842" : "#7A8099",
      transition: "all 0.2s",
      letterSpacing: "0.02em",
    }),
    cartBadge: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 16px",
      background: selectedCreators.length > 0 ? "#F5C842" : "#1A1F2E",
      color: selectedCreators.length > 0 ? "#080B12" : "#7A8099",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.3s",
      border: "none",
    },
    hero: {
      padding: "80px 32px 48px",
      maxWidth: "1400px",
      margin: "0 auto",
    },
    heroTag: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 12px",
      background: "rgba(245,200,66,0.1)",
      border: "1px solid rgba(245,200,66,0.3)",
      borderRadius: "100px",
      fontSize: "11px",
      fontWeight: 600,
      color: "#F5C842",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "24px",
    },
    heroTitle: {
      fontSize: "clamp(36px, 5vw, 64px)",
      fontWeight: 800,
      lineHeight: 1.05,
      letterSpacing: "-2px",
      marginBottom: "16px",
      color: "#E8EAF0",
    },
    heroAccent: { color: "#F5C842" },
    heroSub: {
      fontSize: "16px",
      color: "#7A8099",
      fontFamily: "'JetBrains Mono', monospace",
      marginBottom: "40px",
      fontWeight: 300,
    },
    statsRow: {
      display: "flex",
      gap: "32px",
      flexWrap: "wrap",
      marginBottom: "48px",
    },
    stat: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    statVal: {
      fontSize: "28px",
      fontWeight: 800,
      color: "#F5C842",
      letterSpacing: "-1px",
    },
    statLabel: {
      fontSize: "11px",
      color: "#4A5068",
      fontFamily: "'JetBrains Mono', monospace",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
    },
    toolbar: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "0 32px 24px",
      display: "flex",
      gap: "12px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    searchInput: {
      flex: "1",
      minWidth: "200px",
      padding: "10px 16px",
      background: "#0E1320",
      border: "1px solid #1A1F2E",
      borderRadius: "8px",
      color: "#E8EAF0",
      fontSize: "13px",
      fontFamily: "'JetBrains Mono', monospace",
      outline: "none",
    },
    select: {
      padding: "10px 14px",
      background: "#0E1320",
      border: "1px solid #1A1F2E",
      borderRadius: "8px",
      color: "#7A8099",
      fontSize: "12px",
      fontFamily: "'Syne', sans-serif",
      fontWeight: 600,
      cursor: "pointer",
      outline: "none",
    },
    sortLabel: {
      fontSize: "11px",
      color: "#4A5068",
      fontFamily: "'JetBrains Mono', monospace",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      marginLeft: "auto",
    },
    grid: {
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "0 32px 80px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
      gap: "12px",
    },
    card: (selected, hovered) => ({
      background: selected ? "rgba(245,200,66,0.05)" : "#0C1018",
      border: `1px solid ${selected ? "#F5C842" : hovered ? "#2A3048" : "#151B2A"}`,
      borderRadius: "12px",
      padding: "20px",
      cursor: "pointer",
      transition: "all 0.2s",
      transform: hovered ? "translateY(-2px)" : "none",
      position: "relative",
      overflow: "hidden",
    }),
    cardGlow: (selected) => ({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "1px",
      background: selected ? "linear-gradient(90deg, transparent, #F5C842, transparent)" : "transparent",
      transition: "all 0.3s",
    }),
    cardHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: "16px",
    },
    avatarRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    avatar: (tier) => ({
      width: "44px",
      height: "44px",
      borderRadius: "4px",
      flexShrink: 0,
    }),
    creatorName: {
      fontSize: "15px",
      fontWeight: 700,
      color: "#E8EAF0",
      marginBottom: "2px",
    },
    creatorHandle: {
      fontSize: "11px",
      color: "#4A5068",
      fontFamily: "'JetBrains Mono', monospace",
    },
    tierBadge: (tier) => ({
      padding: "3px 8px",
      borderRadius: "4px",
      fontSize: "9px",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      background: `rgba(${tier === "Premium" ? "245,200,66" : "100,255,218"},0.1)`,
      color: TIER_COLORS[tier],
      border: `1px solid rgba(${tier === "Premium" ? "245,200,66" : "100,255,218"},0.2)`,
    }),
    metrics: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "10px",
      marginBottom: "14px",
    },
    metric: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    },
    metricVal: {
      fontSize: "16px",
      fontWeight: 700,
      color: "#E8EAF0",
      letterSpacing: "-0.5px",
      fontFamily: "'Syne', sans-serif",
    },
    metricLabel: {
      fontSize: "9px",
      color: "#4A5068",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontFamily: "'JetBrains Mono', monospace",
    },
    engagementBar: (rate) => ({
      height: "2px",
      background: "#1A1F2E",
      borderRadius: "1px",
      marginBottom: "14px",
      position: "relative",
      overflow: "hidden",
    }),
    engagementFill: (rate) => ({
      position: "absolute",
      left: 0,
      top: 0,
      height: "100%",
      width: `${Math.min(rate * 10, 100)}%`,
      background: rate > 6 ? "#34D399" : rate > 4 ? "#F5C842" : "#FB923C",
      borderRadius: "1px",
      transition: "width 0.6s ease",
    }),
    niches: {
      display: "flex",
      gap: "4px",
      flexWrap: "wrap",
      marginBottom: "16px",
    },
    nichePill: (niche) => ({
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "9px",
      fontWeight: 600,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      background: `rgba(${hexToRgb(NICHE_COLORS[niche] || "#7A8099")}, 0.1)`,
      color: NICHE_COLORS[niche] || "#7A8099",
    }),
    cardFooter: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: "14px",
      borderTop: "1px solid #151B2A",
    },
    price: {
      display: "flex",
      flexDirection: "column",
      gap: "1px",
    },
    priceVal: {
      fontSize: "18px",
      fontWeight: 800,
      color: "#E8EAF0",
      letterSpacing: "-0.5px",
    },
    priceLabel: {
      fontSize: "9px",
      color: "#4A5068",
      fontFamily: "'JetBrains Mono', monospace",
      textTransform: "uppercase",
    },
    selectBtn: (selected) => ({
      padding: "8px 16px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: 700,
      cursor: "pointer",
      border: "none",
      background: selected ? "#F5C842" : "#1A2035",
      color: selected ? "#080B12" : "#7A8099",
      transition: "all 0.2s",
      letterSpacing: "0.03em",
    }),
    countryFlag: {
      fontSize: "10px",
      color: "#4A5068",
      fontFamily: "'JetBrains Mono', monospace",
    },
    // Campaign builder
    campaignWrap: {
      maxWidth: "800px",
      margin: "0 auto",
      padding: "48px 32px 120px",
    },
    stepIndicator: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
      marginBottom: "48px",
    },
    step: (active, done) => ({
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      fontWeight: 600,
      color: active ? "#F5C842" : done ? "#4A5068" : "#2A3048",
      fontFamily: "'JetBrains Mono', monospace",
    }),
    stepNum: (active, done) => ({
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      border: `1px solid ${active ? "#F5C842" : done ? "#4A5068" : "#2A3048"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "10px",
      background: active ? "rgba(245,200,66,0.1)" : "transparent",
    }),
    stepDivider: { flex: 1, height: "1px", background: "#1A1F2E" },
    sectionTitle: {
      fontSize: "28px",
      fontWeight: 800,
      letterSpacing: "-1px",
      marginBottom: "8px",
      color: "#E8EAF0",
    },
    sectionSub: {
      fontSize: "13px",
      color: "#4A5068",
      fontFamily: "'JetBrains Mono', monospace",
      marginBottom: "32px",
    },
    selectedList: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      marginBottom: "32px",
    },
    selectedItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "#0C1018",
      border: "1px solid #1A1F2E",
      borderRadius: "8px",
    },
    selectedItemLeft: { display: "flex", alignItems: "center", gap: "12px" },
    removeBtn: {
      background: "none",
      border: "none",
      color: "#4A5068",
      cursor: "pointer",
      fontSize: "16px",
      padding: "4px",
      lineHeight: 1,
    },
    summaryBox: {
      padding: "20px",
      background: "rgba(245,200,66,0.05)",
      border: "1px solid rgba(245,200,66,0.2)",
      borderRadius: "10px",
      marginBottom: "24px",
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "20px",
    },
    summaryItem: { display: "flex", flexDirection: "column", gap: "4px" },
    summaryVal: { fontSize: "22px", fontWeight: 800, color: "#F5C842", letterSpacing: "-0.5px" },
    summaryLabel: { fontSize: "10px", color: "#7A8099", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em" },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
      marginBottom: "16px",
    },
    field: { display: "flex", flexDirection: "column", gap: "6px" },
    fieldFull: { display: "flex", flexDirection: "column", gap: "6px", gridColumn: "1 / -1" },
    label: {
      fontSize: "11px",
      fontWeight: 600,
      color: "#7A8099",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      fontFamily: "'JetBrains Mono', monospace",
    },
    input: {
      padding: "10px 14px",
      background: "#0C1018",
      border: "1px solid #1A1F2E",
      borderRadius: "8px",
      color: "#E8EAF0",
      fontSize: "14px",
      fontFamily: "'Syne', sans-serif",
      outline: "none",
    },
    textarea: {
      padding: "12px 14px",
      background: "#0C1018",
      border: "1px solid #1A1F2E",
      borderRadius: "8px",
      color: "#E8EAF0",
      fontSize: "13px",
      fontFamily: "'JetBrains Mono', monospace",
      outline: "none",
      resize: "vertical",
      minHeight: "100px",
      lineHeight: 1.6,
    },
    btnRow: { display: "flex", gap: "12px", justifyContent: "flex-end" },
    primaryBtn: {
      padding: "12px 28px",
      background: "#F5C842",
      color: "#080B12",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: 800,
      cursor: "pointer",
      letterSpacing: "0.03em",
    },
    secondaryBtn: {
      padding: "12px 28px",
      background: "transparent",
      color: "#7A8099",
      border: "1px solid #1A1F2E",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
    },
    successWrap: {
      textAlign: "center",
      padding: "80px 32px",
    },
    successIcon: {
      fontSize: "64px",
      marginBottom: "24px",
    },
    successTitle: {
      fontSize: "36px",
      fontWeight: 800,
      letterSpacing: "-1.5px",
      marginBottom: "12px",
      color: "#E8EAF0",
    },
    successSub: {
      fontSize: "14px",
      color: "#4A5068",
      fontFamily: "'JetBrains Mono', monospace",
      marginBottom: "32px",
    },
    // Dashboard
    dashWrap: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "48px 32px 120px",
    },
    dashGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "16px",
      marginBottom: "32px",
    },
    dashCard: {
      padding: "20px",
      background: "#0C1018",
      border: "1px solid #151B2A",
      borderRadius: "10px",
    },
    dashVal: { fontSize: "30px", fontWeight: 800, color: "#E8EAF0", letterSpacing: "-1px", marginBottom: "4px" },
    dashLabel: { fontSize: "10px", color: "#4A5068", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em" },
    dashDelta: (positive) => ({ fontSize: "11px", color: positive ? "#34D399" : "#FB923C", fontFamily: "'JetBrains Mono', monospace", marginTop: "4px" }),
    table: {
      width: "100%",
      borderCollapse: "collapse",
      background: "#0C1018",
      border: "1px solid #151B2A",
      borderRadius: "10px",
      overflow: "hidden",
    },
    th: {
      padding: "10px 16px",
      textAlign: "left",
      fontSize: "10px",
      fontFamily: "'JetBrains Mono', monospace",
      color: "#4A5068",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      borderBottom: "1px solid #151B2A",
      background: "#080B12",
    },
    td: {
      padding: "14px 16px",
      fontSize: "13px",
      color: "#E8EAF0",
      borderBottom: "1px solid #0E1320",
      fontFamily: "'Syne', sans-serif",
    },
    statusBadge: (status) => ({
      padding: "3px 8px",
      borderRadius: "4px",
      fontSize: "10px",
      fontWeight: 600,
      background: status === "Live" ? "rgba(52,211,153,0.1)" : status === "Pending" ? "rgba(245,200,66,0.1)" : "rgba(100,160,255,0.1)",
      color: status === "Live" ? "#34D399" : status === "Pending" ? "#F5C842" : "#64A0FF",
    }),
    floatingCart: {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#0E1320",
      border: "1px solid #F5C842",
      borderRadius: "12px",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      gap: "24px",
      zIndex: 200,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,200,66,0.1)",
      animation: "slideUp 0.3s ease",
    },
    floatingCartText: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "12px",
      color: "#7A8099",
    },
    floatingCartVal: { color: "#F5C842", fontWeight: 700 },
  };

  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "122,128,153";
  }

  const mockCampaigns = [
    { id: "C-001", name: "TGE Awareness Push", creators: 8, status: "Live", impressions: "1.2M", engagement: "5.4%", spend: "$2,840" },
    { id: "C-002", name: "Product Launch Raid", creators: 12, status: "Live", impressions: "3.8M", engagement: "4.9%", spend: "$5,120" },
    { id: "C-003", name: "Brand Awareness Q1", creators: 5, status: "Pending", impressions: "—", engagement: "—", spend: "$1,650" },
    { id: "C-004", name: "DEX Liquidity Push", creators: 20, status: "Complete", impressions: "8.1M", engagement: "6.2%", spend: "$9,400" },
  ];

  return (
    <div style={styles.app}>
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #2A3048; }
        select option { background: #0E1320; }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .creator-card { animation: fadeIn 0.3s ease forwards; }
        .ticker-track {
          display: flex;
          animation: tickerScroll 40s linear infinite;
          will-change: transform;
        }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        input:focus, textarea:focus { border-color: #F5C842 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080B12; }
        ::-webkit-scrollbar-thumb { background: #1A1F2E; border-radius: 2px; }
      `}</style>

      {/* NAV */}
      <nav style={styles.nav}>
        <div style={styles.logo} onClick={() => { setView("marketplace"); setSubmitted(false); }}>
          ◈ Amplifi3
        </div>
        <div style={styles.navLinks}>
          <button style={styles.navLink(view === "marketplace")} onClick={() => setView("marketplace")}>Marketplace</button>
          <button style={styles.navLink(view === "dashboard")} onClick={() => setView("dashboard")}>Dashboard</button>
          <button
            style={styles.cartBadge}
            onClick={() => { if (selectedCreators.length > 0) { setView("campaign"); setCampaignStep(1); } }}
          >
            {selectedCreators.length > 0 ? `⚡ ${selectedCreators.length} Selected — Book Campaign` : "0 Selected"}
          </button>
        </div>
      </nav>

      {/* MARKETPLACE */}
      {view === "marketplace" && (
        <>
          <div style={styles.hero}>
            <div style={styles.heroTag}>◈ Web3 KOL Network</div>
            <h1 style={styles.heroTitle}>
              Find the right <span style={styles.heroAccent}>creators.</span><br />
              Launch in <span style={styles.heroAccent}>24 hours.</span>
            </h1>
            <p style={styles.heroSub}>
              400+ vetted crypto KOLs. Real engagement. Full transparency.
            </p>
            <div style={styles.statsRow}>
              {[
                { val: "400+", label: "Vetted Creators" },
                { val: "50M+", label: "Total Reach" },
                { val: "4.8%", label: "Avg Engagement" },
                { val: "$0.08", label: "Avg CPE" },
                { val: "24hr", label: "Launch Time" },
              ].map(s => (
                <div key={s.label} style={styles.stat}>
                  <div style={styles.statVal}>{s.val}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Trusted Brands Ticker ── */}
          <div style={{
            width: "100%",
            overflow: "hidden",
            padding: "0 0 48px",
            position: "relative",
          }}>
            {/* fade edges */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: "120px", zIndex: 2,
              background: "linear-gradient(90deg, #080B12 0%, transparent 100%)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", right: 0, top: 0, bottom: 0, width: "120px", zIndex: 2,
              background: "linear-gradient(270deg, #080B12 0%, transparent 100%)",
              pointerEvents: "none",
            }} />

            {/* label */}
            <div style={{
              textAlign: "center",
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "#2A3048",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}>
              Trusted by leading Web3 brands
            </div>

            {/* scrolling track */}
            <div style={{ display: "flex", overflow: "hidden" }}>
              <div className="ticker-track">
                {[
                  { name: "Abstract", symbol: "ABS", color: "#A78BFA" },
                  { name: "Aethir", symbol: "ATH", color: "#00D9FF" },
                  { name: "dYdX", symbol: "DYDX", color: "#6966FF" },
                  { name: "Goldfinch", symbol: "GFI", color: "#F5C842" },
                  { name: "Holoworld", symbol: "HOLO", color: "#34D399" },
                  { name: "Moonshot", symbol: "MOON", color: "#64FFDA" },
                  { name: "Paradex", symbol: "PDX", color: "#FF6B6B" },
                  { name: "Cookie3", symbol: "C3", color: "#FB923C" },
                  { name: "HelloTrade", symbol: "HTRD", color: "#F472B6" },
                  { name: "Vest", symbol: "VST", color: "#C084FC" },
                  { name: "ZeroLend", symbol: "ZERO", color: "#2DD4BF" },
                  { name: "Persona", symbol: "PRS", color: "#FBBF24" },
                  // duplicate for seamless loop
                  { name: "Abstract", symbol: "ABS", color: "#A78BFA" },
                  { name: "Aethir", symbol: "ATH", color: "#00D9FF" },
                  { name: "dYdX", symbol: "DYDX", color: "#6966FF" },
                  { name: "Goldfinch", symbol: "GFI", color: "#F5C842" },
                  { name: "Holoworld", symbol: "HOLO", color: "#34D399" },
                  { name: "Moonshot", symbol: "MOON", color: "#64FFDA" },
                  { name: "Paradex", symbol: "PDX", color: "#FF6B6B" },
                  { name: "Cookie3", symbol: "C3", color: "#FB923C" },
                  { name: "HelloTrade", symbol: "HTRD", color: "#F472B6" },
                  { name: "Vest", symbol: "VST", color: "#C084FC" },
                  { name: "ZeroLend", symbol: "ZERO", color: "#2DD4BF" },
                  { name: "Persona", symbol: "PRS", color: "#FBBF24" },
                ].map((brand, i) => (
                  <div key={i} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 24px",
                    margin: "0 8px",
                    background: "#0C1018",
                    border: "1px solid #151B2A",
                    borderRadius: "8px",
                    flexShrink: 0,
                    transition: "border-color 0.2s",
                    cursor: "default",
                    whiteSpace: "nowrap",
                  }}>
                    {/* Brand icon — pixel punk mini logo */}
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: `${brand.color}18`,
                      border: `1px solid ${brand.color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: brand.color,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "-0.5px",
                    }}>
                      {brand.symbol.slice(0, 2)}
                    </div>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#7A8099",
                      fontFamily: "'Syne', sans-serif",
                      letterSpacing: "-0.2px",
                    }}>
                      {brand.name}
                    </span>
                    <span style={{
                      fontSize: "9px",
                      fontFamily: "'JetBrains Mono', monospace",
                      color: brand.color,
                      opacity: 0.7,
                    }}>
                      ${brand.symbol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.toolbar}>
            <input
              style={styles.searchInput}
              placeholder="Search creators..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select style={styles.select} value={filterNiche} onChange={e => setFilterNiche(e.target.value)}>
              {NICHES.map(n => <option key={n}>{n}</option>)}
            </select>
            <select style={styles.select} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
              {TIERS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select style={styles.select} value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <div style={styles.sortLabel}>Sort:</div>
            <select style={styles.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="monthlyViews">Views</option>
              <option value="followers">Followers</option>
              <option value="engagementRate">Engagement</option>
              <option value="pricePerPost">Price</option>
            </select>
            <div style={{ ...styles.sortLabel, color: "#4A5068" }}>
              {filtered.length} creators
            </div>
          </div>

          <div style={styles.grid}>
            {filtered.map((creator, i) => {
              const selected = !!selectedCreators.find(c => c.id === creator.id);
              const hovered = hoveredCreator === creator.id;
              return (
                <div
                  key={creator.id}
                  className="creator-card"
                  style={{
                    background: selected ? "rgba(245,200,66,0.06)" : hovered ? "#101520" : "#0C1018",
                    border: `1px solid ${selected ? "#F5C842" : hovered ? "#252D42" : "#151B2A"}`,
                    borderRadius: "14px",
                    padding: "16px 12px 14px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    transform: hovered ? "translateY(-3px)" : "none",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    animationDelay: `${i * 0.025}s`,
                    boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
                  }}
                  onMouseEnter={() => setHoveredCreator(creator.id)}
                  onMouseLeave={() => setHoveredCreator(null)}
                  onClick={() => toggleCreator(creator)}
                >
                  {/* top glow line when selected */}
                  <div style={{
                    position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                    background: selected ? "linear-gradient(90deg, transparent, #F5C842, transparent)" : "transparent",
                    transition: "all 0.3s",
                  }} />

                  {/* selected checkmark */}
                  {selected && (
                    <div style={{
                      position: "absolute", top: "8px", right: "8px",
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: "#F5C842", color: "#080B12",
                      fontSize: "10px", fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✓</div>
                  )}

                  {/* Avatar — big, centered */}
                  <div style={{
                    marginBottom: "10px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: `2px solid ${selected ? "#F5C842" : creator.tier === "Premium" ? "rgba(245,200,66,0.2)" : "rgba(100,255,218,0.15)"}`,
                    transition: "border-color 0.2s",
                  }}>
                    <PunkAvatar seed={creator.handle} size={80} />
                  </div>

                  {/* Name */}
                  <div style={{
                    fontSize: "13px", fontWeight: 800, color: "#E8EAF0",
                    letterSpacing: "-0.3px", marginBottom: "3px", lineHeight: 1.2,
                  }}>
                    {creator.name}
                  </div>

                  {/* Followers */}
                  <div style={{
                    fontSize: "12px", fontWeight: 700,
                    color: creator.tier === "Premium" ? "#F5C842" : "#64FFDA",
                    marginBottom: "1px",
                  }}>
                    {formatNum(creator.followers)} followers
                  </div>

                  {/* Monthly views */}
                  <div style={{
                    fontSize: "10px", color: "#4A5068",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: "10px",
                  }}>
                    {formatNum(creator.monthlyViews)} monthly views
                  </div>

                  {/* Tier badge */}
                  <div style={{
                    padding: "4px 12px",
                    borderRadius: "100px",
                    fontSize: "9px", fontWeight: 800,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    background: creator.tier === "Premium" ? "rgba(245,200,66,0.12)" : "rgba(100,255,218,0.1)",
                    color: TIER_COLORS[creator.tier],
                    border: `1px solid ${creator.tier === "Premium" ? "rgba(245,200,66,0.25)" : "rgba(100,255,218,0.2)"}`,
                    marginBottom: "10px",
                  }}>
                    {creator.tier}
                  </div>

                  {/* Price + eng row */}
                  <div style={{
                    width: "100%",
                    paddingTop: "8px",
                    borderTop: "1px solid #151B2A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <div style={{
                      fontSize: "12px", fontWeight: 800, color: "#E8EAF0",
                      letterSpacing: "-0.3px",
                    }}>
                      ${creator.pricePerPost}
                    </div>
                    <div style={{
                      fontSize: "10px", fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: creator.engagementRate > 6 ? "#34D399" : creator.engagementRate > 4 ? "#F5C842" : "#FB923C",
                    }}>
                      {creator.engagementRate}%
                    </div>
                  </div>
                </div>
              );
            })}

            {/* +400 more card */}
            <div style={{
              background: "#0C1018",
              border: "1px dashed #1A1F2E",
              borderRadius: "14px",
              padding: "16px 12px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: "200px",
              gap: "8px",
            }}>
              <div style={{
                fontSize: "28px", fontWeight: 800, color: "#4A5068",
                letterSpacing: "-1px",
              }}>+400</div>
              <div style={{
                fontSize: "11px", color: "#2A3048",
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.5,
              }}>
                more creators<br />in our network
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 32px 80px",
          }}>
            {/* Divider */}
            <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #1A1F2E, transparent)", marginBottom: "80px" }} />

            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "4px 12px", background: "rgba(245,200,66,0.08)",
                border: "1px solid rgba(245,200,66,0.2)", borderRadius: "100px",
                fontSize: "11px", fontWeight: 600, color: "#F5C842",
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "24px",
              }}>◈ Let's Work Together</div>
              <h2 style={{
                fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-2px",
                color: "#E8EAF0", lineHeight: 1.05, marginBottom: "16px",
              }}>
                Own the timeline.<br />
                <span style={{ color: "#F5C842" }}>Starting today.</span>
              </h2>
              <p style={{
                fontSize: "15px", color: "#4A5068",
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 300,
                maxWidth: "480px", margin: "0 auto",
              }}>
                Whether you're a brand ready to launch or a creator looking to earn, we've got the network.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "860px", margin: "0 auto" }}>
              {/* For Brands */}
              <div style={{
                background: "#0C1018",
                border: "1px solid #1A1F2E",
                borderRadius: "16px",
                padding: "40px 36px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* top glow line */}
                <div style={{
                  position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
                  background: "linear-gradient(90deg, transparent, #F5C842, transparent)",
                }} />
                <div style={{ fontSize: "40px", lineHeight: 1 }}>⚡</div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#E8EAF0", letterSpacing: "-0.5px", marginBottom: "8px" }}>
                    For Brands
                  </div>
                  <div style={{ fontSize: "13px", color: "#4A5068", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                    Ready to dominate Crypto Twitter? Pick your creators, set your brief, launch in 24 hours.
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    style={{
                      padding: "14px 24px", background: "#F5C842", color: "#080B12",
                      border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 800,
                      cursor: "pointer", letterSpacing: "0.03em", width: "100%",
                    }}
                    onClick={() => { setView("campaign"); setCampaignStep(1); }}
                  >
                    Book a Campaign →
                  </button>
                  <button
                    style={{
                      padding: "12px 24px", background: "transparent", color: "#7A8099",
                      border: "1px solid #1A1F2E", borderRadius: "8px", fontSize: "13px",
                      fontWeight: 600, cursor: "pointer", width: "100%",
                    }}
                  >
                    Talk to the Team
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {["✓  400+ vetted crypto creators", "✓  Live within 24 hours", "✓  Full analytics reporting"].map(f => (
                    <div key={f} style={{ fontSize: "11px", color: "#4A5068", fontFamily: "'JetBrains Mono', monospace" }}>{f}</div>
                  ))}
                </div>
              </div>

              {/* For Creators */}
              <div style={{
                background: "#0C1018",
                border: "1px solid #1A1F2E",
                borderRadius: "16px",
                padding: "40px 36px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
                  background: "linear-gradient(90deg, transparent, #64FFDA, transparent)",
                }} />
                <div style={{ fontSize: "40px", lineHeight: 1 }}>✦</div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#E8EAF0", letterSpacing: "-0.5px", marginBottom: "8px" }}>
                    For Creators
                  </div>
                  <div style={{ fontSize: "13px", color: "#4A5068", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                    Join the network. Get matched to brand campaigns. Earn from posts you're already making.
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    style={{
                      padding: "14px 24px",
                      background: "linear-gradient(135deg, #64FFDA, #06B6D4)",
                      color: "#080B12",
                      border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 800,
                      cursor: "pointer", letterSpacing: "0.03em", width: "100%",
                    }}
                  >
                    Apply to Join ✦
                  </button>
                  <button
                    style={{
                      padding: "12px 24px", background: "transparent", color: "#7A8099",
                      border: "1px solid #1A1F2E", borderRadius: "8px", fontSize: "13px",
                      fontWeight: 600, cursor: "pointer", width: "100%",
                    }}
                  >
                    Follow on X →
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {["✓  Paid in USDC or fiat", "✓  Choose your campaigns", "✓  No exclusivity required"].map(f => (
                    <div key={f} style={{ fontSize: "11px", color: "#4A5068", fontFamily: "'JetBrains Mono', monospace" }}>{f}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer line */}
            <div style={{
              textAlign: "center", marginTop: "56px", paddingTop: "32px",
              borderTop: "1px solid #0E1320",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "32px", flexWrap: "wrap",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#F5C842", letterSpacing: "-0.5px" }}>◈ Amplifi3</div>
              <div style={{ fontSize: "11px", color: "#2A3048", fontFamily: "'JetBrains Mono', monospace" }}>© 2026 Amplifi3. All rights reserved.</div>
              <div style={{ fontSize: "11px", color: "#2A3048", fontFamily: "'JetBrains Mono', monospace" }}>Web3 KOL Network</div>
            </div>
          </div>

          {/* Floating cart */}
          {selectedCreators.length > 0 && (
            <div style={styles.floatingCart}>
              <div>
                <span style={styles.floatingCartVal}>{selectedCreators.length}</span>
                <span style={styles.floatingCartText}> creators · </span>
                <span style={styles.floatingCartVal}>{formatNum(totalReach)}</span>
                <span style={styles.floatingCartText}> reach · </span>
                <span style={styles.floatingCartVal}>${totalBudget}</span>
                <span style={styles.floatingCartText}> est.</span>
              </div>
              <button
                style={styles.primaryBtn}
                onClick={() => { setView("campaign"); setCampaignStep(1); }}
              >
                Book Campaign →
              </button>
              <button style={styles.secondaryBtn} onClick={() => setSelectedCreators([])}>Clear</button>
            </div>
          )}
        </>
      )}

      {/* CAMPAIGN BUILDER */}
      {view === "campaign" && !submitted && (
        <div style={styles.campaignWrap}>
          <div style={styles.stepIndicator}>
            {["Review Roster", "Campaign Brief", "Confirm & Launch"].map((label, i) => (
              <>
                <div key={label} style={styles.step(campaignStep === i + 1, campaignStep > i + 1)}>
                  <div style={styles.stepNum(campaignStep === i + 1, campaignStep > i + 1)}>
                    {campaignStep > i + 1 ? "✓" : i + 1}
                  </div>
                  {label}
                </div>
                {i < 2 && <div style={styles.stepDivider} />}
              </>
            ))}
          </div>

          {campaignStep === 1 && (
            <>
              <h2 style={styles.sectionTitle}>Review your roster</h2>
              <p style={styles.sectionSub}>Adjust your creator selection before building the brief.</p>

              <div style={styles.summaryBox}>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryVal}>{selectedCreators.length}</div>
                    <div style={styles.summaryLabel}>Creators</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryVal}>{formatNum(totalReach)}</div>
                    <div style={styles.summaryLabel}>Est. Reach</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryVal}>${totalBudget}</div>
                    <div style={styles.summaryLabel}>Est. Cost</div>
                  </div>
                </div>
              </div>

              <div style={styles.selectedList}>
                {selectedCreators.map(c => (
                  <div key={c.id} style={styles.selectedItem}>
                    <div style={styles.selectedItemLeft}>
                      <PunkAvatar seed={c.handle} size={44} />
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: "11px", color: "#4A5068", fontFamily: "'JetBrains Mono', monospace" }}>
                          {formatNum(c.monthlyViews)} views/mo · {c.engagementRate}% eng
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 700 }}>${c.pricePerPost}</div>
                      <button style={styles.removeBtn} onClick={() => toggleCreator(c)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.btnRow}>
                <button style={styles.secondaryBtn} onClick={() => setView("marketplace")}>← Back</button>
                <button style={styles.primaryBtn} onClick={() => setCampaignStep(2)}>Continue →</button>
              </div>
            </>
          )}

          {campaignStep === 2 && (
            <>
              <h2 style={styles.sectionTitle}>Build your brief</h2>
              <p style={styles.sectionSub}>Tell creators what to post. We handle the rest.</p>

              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Campaign Name</label>
                  <input
                    style={styles.input}
                    placeholder="e.g. TGE Launch Push"
                    value={brief.name}
                    onChange={e => setBrief({ ...brief, name: e.target.value })}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Primary Goal</label>
                  <select
                    style={styles.select}
                    value={brief.goal}
                    onChange={e => setBrief({ ...brief, goal: e.target.value })}
                  >
                    <option value="">Select goal...</option>
                    <option>TGE / Token Launch</option>
                    <option>Brand Awareness</option>
                    <option>Waitlist / Signups</option>
                    <option>TVL Growth</option>
                    <option>NFT Mint</option>
                    <option>Protocol Launch</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Budget (USD)</label>
                  <input
                    style={styles.input}
                    placeholder="$5,000"
                    value={brief.budget}
                    onChange={e => setBrief({ ...brief, budget: e.target.value })}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Timeline</label>
                  <select
                    style={styles.select}
                    value={brief.timeline}
                    onChange={e => setBrief({ ...brief, timeline: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option>24 hours</option>
                    <option>3 days</option>
                    <option>1 week</option>
                    <option>2 weeks</option>
                    <option>1 month</option>
                  </select>
                </div>
                <div style={styles.fieldFull}>
                  <label style={styles.label}>Campaign Brief / Key Messages</label>
                  <textarea
                    style={styles.textarea}
                    placeholder="Describe your project, key talking points, tone, and any specific requirements for creators..."
                    value={brief.notes}
                    onChange={e => setBrief({ ...brief, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.btnRow}>
                <button style={styles.secondaryBtn} onClick={() => setCampaignStep(1)}>← Back</button>
                <button style={styles.primaryBtn} onClick={() => setCampaignStep(3)}>Review →</button>
              </div>
            </>
          )}

          {campaignStep === 3 && (
            <>
              <h2 style={styles.sectionTitle}>Confirm & launch</h2>
              <p style={styles.sectionSub}>Review your campaign before we activate the network.</p>

              <div style={styles.summaryBox}>
                <div style={{ marginBottom: "20px", fontSize: "14px", color: "#7A8099", fontFamily: "'JetBrains Mono', monospace" }}>
                  Campaign: <span style={{ color: "#F5C842" }}>{brief.name || "Untitled Campaign"}</span>
                </div>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryVal}>{selectedCreators.length}</div>
                    <div style={styles.summaryLabel}>Creators</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryVal}>{formatNum(totalReach)}</div>
                    <div style={styles.summaryLabel}>Est. Reach</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryVal}>${totalBudget}</div>
                    <div style={styles.summaryLabel}>Campaign Cost</div>
                  </div>
                </div>
              </div>

              {brief.goal && (
                <div style={{ ...styles.summaryBox, background: "#0C1018", borderColor: "#1A1F2E" }}>
                  <div style={{ fontSize: "11px", color: "#4A5068", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Brief Summary</div>
                  <div style={{ fontSize: "13px", color: "#7A8099" }}>
                    <strong style={{ color: "#E8EAF0" }}>Goal:</strong> {brief.goal}<br />
                    <strong style={{ color: "#E8EAF0" }}>Timeline:</strong> {brief.timeline || "TBD"}<br />
                    {brief.notes && <><strong style={{ color: "#E8EAF0" }}>Notes:</strong> {brief.notes}</>}
                  </div>
                </div>
              )}

              <div style={{ padding: "16px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "8px", marginBottom: "24px" }}>
                <div style={{ fontSize: "12px", color: "#34D399", fontFamily: "'JetBrains Mono', monospace" }}>
                  ⚡ Campaigns go live within 24-48 hours after review. You'll receive a brief confirmation and creator list within 2 hours.
                </div>
              </div>

              <div style={styles.btnRow}>
                <button style={styles.secondaryBtn} onClick={() => setCampaignStep(2)}>← Edit Brief</button>
                <button style={styles.primaryBtn} onClick={() => setSubmitted(true)}>Launch Campaign ⚡</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* SUCCESS */}
      {view === "campaign" && submitted && (
        <div style={{ ...styles.campaignWrap, textAlign: "center" }}>
          <div style={styles.successIcon}>⚡</div>
          <h2 style={styles.successTitle}>Campaign Launched</h2>
          <p style={styles.successSub}>
            Your brief is being reviewed. Expect creator confirmation within 2 hours.<br />
            Posts go live within 24 hours.
          </p>
          <div style={{ ...styles.summaryBox, display: "inline-block", textAlign: "left", minWidth: "320px" }}>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}>
                <div style={styles.summaryVal}>{selectedCreators.length}</div>
                <div style={styles.summaryLabel}>Creators</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryVal}>{formatNum(totalReach)}</div>
                <div style={styles.summaryLabel}>Reach</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryVal}>${totalBudget}</div>
                <div style={styles.summaryLabel}>Budget</div>
              </div>
            </div>
          </div>
          <br /><br />
          <button style={styles.primaryBtn} onClick={() => { setView("dashboard"); setSubmitted(false); }}>
            View Dashboard →
          </button>
        </div>
      )}

      {/* DASHBOARD */}
      {view === "dashboard" && (
        <div style={styles.dashWrap}>
          <h2 style={{ ...styles.sectionTitle, marginBottom: "8px" }}>Campaign Dashboard</h2>
          <p style={styles.sectionSub}>Track performance across all active campaigns.</p>

          <div style={styles.dashGrid}>
            {[
              { label: "Total Impressions", val: "13.1M", delta: "+42% vs last month", pos: true },
              { label: "Avg Engagement", val: "5.4%", delta: "+0.6% vs benchmark", pos: true },
              { label: "Active Campaigns", val: "2", delta: "3 total this month", pos: null },
              { label: "Total Spend", val: "$19.0K", delta: "Within budget", pos: true },
            ].map(d => (
              <div key={d.label} style={styles.dashCard}>
                <div style={styles.dashVal}>{d.val}</div>
                <div style={styles.dashLabel}>{d.label}</div>
                {d.pos !== null && <div style={styles.dashDelta(d.pos)}>{d.delta}</div>}
              </div>
            ))}
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                {["ID", "Campaign", "Creators", "Status", "Impressions", "Engagement", "Spend"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockCampaigns.map(c => (
                <tr key={c.id}>
                  <td style={{ ...styles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#4A5068" }}>{c.id}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{c.name}</td>
                  <td style={styles.td}>{c.creators}</td>
                  <td style={styles.td}><span style={styles.statusBadge(c.status)}>{c.status}</span></td>
                  <td style={{ ...styles.td, fontFamily: "'JetBrains Mono', monospace" }}>{c.impressions}</td>
                  <td style={{ ...styles.td, color: parseFloat(c.engagement) > 5 ? "#34D399" : c.engagement === "—" ? "#4A5068" : "#F5C842" }}>{c.engagement}</td>
                  <td style={{ ...styles.td, fontFamily: "'JetBrains Mono', monospace" }}>{c.spend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
