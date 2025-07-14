import { useState } from "react";
import { useMap } from "react-leaflet";

export default function SearchBar() {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim() || !map) return;

    setLoading(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        {
          headers: {
            "User-Agent": "SeuAppNomeAqui - contato@example.com", // Troque para sua aplicação/email
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          },
        }
      );

      const data = await res.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        map.setView([parseFloat(lat), parseFloat(lon)], 17);
      } else {
        alert("Nenhum resultado encontrado.");
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      alert("Erro ao buscar endereço.");
    } finally {
      setLoading(false);
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
      aria-label="Busca de endereço"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar endereço..."
        style={{ padding: 6, width: 180, borderRadius: 4, border: "1px solid #ccc" }}
        aria-label="Campo para busca de endereço"
        disabled={loading}
      />
      <button
        type="submit"
        style={{
          padding: "6px 12px",
          borderRadius: 4,
          background: loading ? "#6c757d" : "#007bff",
          color: "#fff",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
        }}
        disabled={loading}
        aria-disabled={loading}
      >
        {loading ? "Buscando..." : "Buscar"}
      </button>
    </form>
  );
}
