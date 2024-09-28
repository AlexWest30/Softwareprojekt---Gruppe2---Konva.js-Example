import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const [tool, setTool] = useState('pencil');
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]); // History to track previous states
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 400 });
  const layerRef = useRef(null); // Reference to the layer for force redraw
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [bgImage, setBgImage] = useState(null); // State for the background image

    // Handle image loading
    useEffect(() => {
      if (file) {
        const reader = new FileReader();
        const img = new window.Image();

        reader.onload = function (e) {
          img.src = e.target.result;
          img.onload = () => {
            setBgImage(img); // Set the loaded image as background
          };
        };

        reader.readAsDataURL(file);
      }
    }, [file]);

  //   // Event-Handler für Datei-Drop
  //   const handleDrop = (event) => {
  //     event.preventDefault();
  //     setIsDragging(false);
        
  //     const droppedFile = event.dataTransfer.files[0];
      
  //     // Überprüfen, ob die Datei ein Bild ist (jpg oder png)
  //     if (droppedFile && (droppedFile.type === "image/jpeg" || droppedFile.type === "image/png")) {
  //       setFile(droppedFile);
  //     } else {
  //       alert("Bitte laden Sie nur Bilder (jpg oder png) hoch.");
  //     }
  // };

  // Dragging-Events verhindern das Standardverhalten
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

    // Event-Handler für Datei-Drop
    const handleFileDrop = (event) => {
      event.preventDefault();
      setIsDragging(false);
      
      const droppedFile = event.dataTransfer.files[0];
      
      // Überprüfen, ob die Datei ein Bild ist (jpg oder png)
      if (droppedFile && (droppedFile.type === "image/jpeg" || droppedFile.type === "image/png")) {
        setFile(droppedFile);
      } else {
        alert("Bitte laden Sie nur Bilder (jpg oder png) hoch.");
      }
    };

  const handleDeleteFile = () => {
    setFile(null); // Setzt den Dateinamen zurück
    setBgImage(null); // Clear the background image state
  };

  // Function to handle window resizing
  useEffect(() => {
    const updateStageSize = () => {
      const containerWidth = stageRef.current.container().offsetWidth;
      const containerHeight = stageRef.current.container().offsetHeight;
      setStageSize({ width: containerWidth, height: containerHeight });
    };

    window.addEventListener('resize', updateStageSize);
    updateStageSize();

    return () => {
      window.removeEventListener('resize', updateStageSize);
    };
  }, []);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    lines.splice(lines.length - 1, 1, lastLine);
    setLines([...lines]);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    setHistory([...history, lines]); // Save the current state to history
  };

  // Undo function to cancel the last edit
  const undoLastLine = () => {
    if (history.length === 0) return; // No history to undo
    if (history.length === 1) {
      setLines([]);
      setHistory([]);
    }
    else {
      const previousLines = history[history.length - 2]; // Get the last saved state
      setLines(previousLines); // Restore the previous state
      setHistory(history.slice(0, -1)); // Remove the last entry from the history
    }
    layerRef.current.batchDraw(); // Ensure the canvas re-renders after undoing
  };

  // Clear all lines from the canvas
  const clearCanvas = () => {
    setLines([]); // Clear all the drawn lines
    setHistory([]); // Clear the history as well
    layerRef.current.batchDraw(); // Ensure the canvas re-renders after clearing
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Konva Drawing App</h1>

        <div
          className="dropzone"
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {file ? (
            <>
              <span>{file.name}</span>
              <img
                src={"https://img.icons8.com/ios-glyphs/30/ffffff/trash.png"}
                alt="Delete"
                className="trash-icon"
                onClick={handleDeleteFile}
              />
            </>
          ) : (
            'Datei hier ablegen'
          )}
        </div>

        <div className="toolbar">
          <button onClick={() => setTool('pencil')} className={tool === 'pencil' ? 'active' : ''}>
            ✏️ Pencil
          </button>
          <button onClick={() => setTool('eraser')} className={tool === 'eraser' ? 'active' : ''}>
            🖌️ Eraser
          </button>
          <button onClick={undoLastLine}>
            ⏪ Undo
          </button>
          <button onClick={clearCanvas}>
            🧹 Clear All
          </button>
        </div>
        <div className="stage-container">
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            className="konva-stage"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ backgroundColor: 'white' }} // Set background color to white
          >
            <Layer ref={layerRef}>
              {bgImage && (
                <KonvaImage
                  image={bgImage}
                  x={0}
                  y={0}
                  width={stageSize.width}
                  height={stageSize.height}
                  listening={false} // Make sure the image doesn't block drawing actions
                />
              )}

              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.tool === 'eraser' ? '#ffffff' : '#000000'}
                  strokeWidth={line.tool === 'eraser' ? 20 : 5}
                  tension={0.5}
                  lineCap="round"
                  globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </header>
    </div>
  );
}

export default App;
