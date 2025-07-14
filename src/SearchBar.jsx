import { useState } from "react";
import { useMap } from "react-leaflet";

export default function SearchBar() {
  const map = useMap();
  const [query, setQuery] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query || !map) return;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    if (data.length > 0) {
      const { lat, lon } = data[0];
      map.setView([parseFloat(lat), parseFloat(lon)], 17);
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 1000,
        backgroundColor: "white",
        padding: 8,
        borderRadius: 6,
        boxShadow: "0 0 5px rgba(0,0,0,0.3)",
        display: "flex",
        gap: 6,
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar endereço..."
        style={{ padding: 6, width: 180, borderRadius: 4, border: "1px solid #ccc" }}
      />
      <button
        type="submit"
        style={{
          padding: "6px 12px",
          borderRadius: 4,
          background: "#007bff",
          color: "#fff",
          border: "none",
        }}
      >
        Buscar
      </button>
    </form>
  );
}
