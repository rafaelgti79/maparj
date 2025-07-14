import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Circle,
  useMapEvent,
  useMap,
} from "react-leaflet";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Componente da barra de busca
function SearchBar() {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim() || !map) return;

    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            "User-Agent": "SeuAppNomeAqui - contato@example.com", // Substitua pelo seu e-mail ou app
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

// Componente que gerencia desenho e eventos do mapa
function DrawShapes({
  lines,
  setLines,
  circles,
  setCircles,
  selectedLineIndex,
  setSelectedLineIndex,
  selectedCircleIndex,
  setSelectedCircleIndex,
}) {
  const [currentLine, setCurrentLine] = useState([]);
  const [drawingCircle, setDrawingCircle] = useState(false);
  const circleCenter = useRef(null);
  const drawingLine = useRef(false);

  useMapEvent("contextmenu", (e) => {
    e.originalEvent.preventDefault();
  });

  useMapEvent({
    mousedown(e) {
      if (e.originalEvent.button === 2) {
        if (!drawingCircle) {
          if (e.originalEvent.shiftKey) {
            setDrawingCircle(true);
            circleCenter.current = e.latlng;
            setSelectedCircleIndex(null);
            setSelectedLineIndex(null);
          } else {
            drawingLine.current = true;
            setCurrentLine([e.latlng]);
            setSelectedLineIndex(null);
            setSelectedCircleIndex(null);
          }
        }
      }
    },
    mousemove(e) {
      if (drawingLine.current) {
        setCurrentLine((line) => [...line, e.latlng]);
      } else if (drawingCircle && circleCenter.current) {
        const radius = circleCenter.current.distanceTo(e.latlng);
        setCircles((oldCircles) => {
          if (
            !oldCircles.length ||
            !oldCircles[oldCircles.length - 1].drawing
          ) {
            return [
              ...oldCircles,
              { center: circleCenter.current, radius, drawing: true },
            ];
          } else {
            const updated = [...oldCircles];
            updated[updated.length - 1] = {
              center: circleCenter.current,
              radius,
              drawing: true,
            };
            return updated;
          }
        });
      }
    },
    mouseup(e) {
      if (drawingLine.current && e.originalEvent.button === 2) {
        drawingLine.current = false;
        if (currentLine.length > 2) {
          setLines((oldLines) => [...oldLines, currentLine]);
        }
        setCurrentLine([]);
      }
      if (drawingCircle && e.originalEvent.button === 2) {
        setDrawingCircle(false);
        setCircles((old) =>
          old.map((c, i) =>
            i === old.length - 1 ? { center: c.center, radius: c.radius } : c
          )
        );
        circleCenter.current = null;
      }
    },
    mouseleave() {
      if (drawingLine.current) {
        drawingLine.current = false;
        if (currentLine.length > 2) {
          setLines((old) => [...old, currentLine]);
        }
        setCurrentLine([]);
      }
      if (drawingCircle) {
        setDrawingCircle(false);
        setCircles((old) => old.filter((c) => !c.drawing));
        circleCenter.current = null;
      }
    },
  });

  return (
    <>
      {lines.map((line, i) => (
        <Polygon
          key={`line-${i}`}
          positions={line}
          pathOptions={{
            color: selectedLineIndex === i ? "orange" : "green",
            weight: selectedLineIndex === i ? 6 : 4,
            fillColor: "green",
            fillOpacity: 0.4,
          }}
          eventHandlers={{
            click: () => {
              setSelectedLineIndex(i);
              setSelectedCircleIndex(null);
            },
          }}
        />
      ))}

      {currentLine.length > 2 && (
        <Polygon
          positions={currentLine}
          pathOptions={{
            color: "red",
            fillColor: "red",
            fillOpacity: 0.3,
            weight: 4,
          }}
        />
      )}

      {circles.map((circle, i) => (
        <Circle
          key={`circle-${i}`}
          center={circle.center}
          radius={circle.radius}
          pathOptions={{
            color: selectedCircleIndex === i ? "orange" : "blue",
            weight: selectedCircleIndex === i ? 5 : 3,
            fillOpacity: 0.2,
          }}
          eventHandlers={{
            click: () => {
              setSelectedCircleIndex(i);
              setSelectedLineIndex(null);
            },
          }}
        />
      ))}
    </>
  );
}

export default function Mapa() {
  const [lines, setLines] = useState([]);
  const [circles, setCircles] = useState([]);
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [selectedCircleIndex, setSelectedCircleIndex] = useState(null);

  const [lineDocIds, setLineDocIds] = useState([]);
  const [circleDocIds, setCircleDocIds] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const linhasSnapshot = await getDocs(collection(db, "linhas"));
        const loadedLines = [];
        const loadedLineIds = [];
        linhasSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.points && Array.isArray(data.points)) {
            const points = data.points.map((p) => [p.lat, p.lng]);
            loadedLines.push(points);
            loadedLineIds.push(doc.id);
          }
        });

        const circulosSnapshot = await getDocs(collection(db, "circulos"));
        const loadedCircles = [];
        const loadedCircleIds = [];
        circulosSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.center && data.radius) {
            loadedCircles.push({
              center: { lat: data.center.lat, lng: data.center.lng },
              radius: data.radius,
            });
            loadedCircleIds.push(doc.id);
          }
        });

        setLines(loadedLines);
        setLineDocIds(loadedLineIds);
        setCircles(loadedCircles);
        setCircleDocIds(loadedCircleIds);
      } catch (error) {
        console.error("Erro ao carregar dados do Firestore:", error);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function saveLines() {
      try {
        if (lineDocIds.length > lines.length) {
          for (let i = lines.length; i < lineDocIds.length; i++) {
            await deleteDoc(doc(db, "linhas", lineDocIds[i]));
          }
          setLineDocIds((old) => old.slice(0, lines.length));
        }

        for (let i = 0; i < lines.length; i++) {
          const points = lines[i].map((p) => ({
            lat: p.lat ?? p[0],
            lng: p.lng ?? p[1],
          }));
          if (lineDocIds[i]) {
            await setDoc(doc(db, "linhas", lineDocIds[i]), { points });
          } else {
            const newDoc = await addDoc(collection(db, "linhas"), { points });
            setLineDocIds((old) => {
              const copy = [...old];
              copy[i] = newDoc.id;
              return copy;
            });
          }
        }
      } catch (error) {
        console.error("Erro ao salvar linhas:", error);
      }
    }
    saveLines();
  }, [lines]);

  useEffect(() => {
    async function saveCircles() {
      try {
        if (circleDocIds.length > circles.length) {
          for (let i = circles.length; i < circleDocIds.length; i++) {
            await deleteDoc(doc(db, "circulos", circleDocIds[i]));
          }
          setCircleDocIds((old) => old.slice(0, circles.length));
        }

        for (let i = 0; i < circles.length; i++) {
          const circleData = {
            center: {
              lat: circles[i].center.lat,
              lng: circles[i].center.lng,
            },
            radius: circles[i].radius,
          };
          if (circleDocIds[i]) {
            await setDoc(doc(db, "circulos", circleDocIds[i]), circleData);
          } else {
            const newDoc = await addDoc(collection(db, "circulos"), circleData);
            setCircleDocIds((old) => {
              const copy = [...old];
              copy[i] = newDoc.id;
              return copy;
            });
          }
        }
      } catch (error) {
        console.error("Erro ao salvar círculos:", error);
      }
    }
    saveCircles();
  }, [circles]);

  async function removeSelectedShape() {
    try {
      if (selectedLineIndex !== null) {
        if (lineDocIds[selectedLineIndex]) {
          await deleteDoc(doc(db, "linhas", lineDocIds[selectedLineIndex]));
          setLineDocIds((old) =>
            old.filter((_, i) => i !== selectedLineIndex)
          );
        }
        setLines((old) => old.filter((_, i) => i !== selectedLineIndex));
        setSelectedLineIndex(null);
      } else if (selectedCircleIndex !== null) {
        if (circleDocIds[selectedCircleIndex]) {
          await deleteDoc(doc(db, "circulos", circleDocIds[selectedCircleIndex]));
          setCircleDocIds((old) =>
            old.filter((_, i) => i !== selectedCircleIndex)
          );
        }
        setCircles((old) => old.filter((_, i) => i !== selectedCircleIndex));
        setSelectedCircleIndex(null);
      }
    } catch (error) {
      console.error("Erro ao remover shape:", error);
    }
  }

  return (
    <>
      <MapContainer
        center={[-22.9068, -43.1729]}
        zoom={13}
        style={{ width: "100vw", height: "100vh" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <DrawShapes
          lines={lines}
          setLines={setLines}
          circles={circles}
          setCircles={setCircles}
          selectedLineIndex={selectedLineIndex}
          setSelectedLineIndex={setSelectedLineIndex}
          selectedCircleIndex={selectedCircleIndex}
          setSelectedCircleIndex={setSelectedCircleIndex}
        />

        <SearchBar />
      </MapContainer>

      <div
        style={{
          position: "absolute",
          top: 60,
          left: 10,
          zIndex: 1000,
          backgroundColor: "white",
          padding: 10,
          borderRadius: 6,
          boxShadow: "0 0 5px rgba(0,0,0,0.3)",
          maxWidth: 250,
        }}
      >
        <button
          onClick={removeSelectedShape}
          disabled={selectedLineIndex === null && selectedCircleIndex === null}
          style={{
            backgroundColor:
              selectedLineIndex === null && selectedCircleIndex === null
                ? "#ccc"
                : "#d9534f",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: 4,
            cursor:
              selectedLineIndex === null && selectedCircleIndex === null
                ? "not-allowed"
                : "pointer",
          }}
          aria-disabled={selectedLineIndex === null && selectedCircleIndex === null}
        >
          Apagar linha ou círculo selecionado
        </button>
        <p style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
          Use o botão direito do mouse para pintar. Segure Shift para desenhar
          círculo. Clique em uma linha ou círculo para selecionar.
        </p>
      </div>
    </>
  );
}
