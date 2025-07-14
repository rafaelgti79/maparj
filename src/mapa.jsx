import { useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Circle,
  useMapEvent,
} from "react-leaflet";
import SearchBar from "./SearchBar";

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
          if (!oldCircles.length || !oldCircles[oldCircles.length - 1].drawing) {
            return [...oldCircles, { center: circleCenter.current, radius, drawing: true }];
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

  function removeSelectedShape() {
    if (selectedLineIndex !== null) {
      setLines((old) => old.filter((_, i) => i !== selectedLineIndex));
      setSelectedLineIndex(null);
    } else if (selectedCircleIndex !== null) {
      setCircles((old) => old.filter((_, i) => i !== selectedCircleIndex));
      setSelectedCircleIndex(null);
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

        <SearchBar />

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
        >
          Apagar linha ou círculo selecionado
        </button>
        <p style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
          Use o botão direito do mouse para pintar. Segure Shift para desenhar círculo.
          Clique em uma linha ou círculo para selecionar.
        </p>
      </div>
    </>
  );
}
