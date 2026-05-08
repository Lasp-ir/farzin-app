import { useState } from 'react';
import { Chessboard } from 'react-chessboard';

const Board = Chessboard as any;

export default function App() {
  const [fen, setFen] = useState("start");

  async function onDrop(sourceSquare: string, targetSquare: string) {
    try {
      const response = await fetch("http://127.0.0.1:8000/validate_move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: fen,
          source: sourceSquare,
          target: targetSquare
        })
      });

      const data = await response.json();

      if (data.valid) {
        setFen(data.fen);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Connection error:", error);
      return false;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-4xl font-bold mb-8 text-blue-400">Farzin Engine</h1>
      <div className="w-full max-w-[500px] shadow-2xl rounded-lg overflow-hidden">
        <Board 
          position={fen} 
          onPieceDrop={onDrop}
          customDarkSquareStyle={{ backgroundColor: '#4b7399' }}
          customLightSquareStyle={{ backgroundColor: '#eae9d2' }}
        />
      </div>
    </div>
  );
}