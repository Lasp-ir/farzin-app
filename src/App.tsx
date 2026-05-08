import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

function App() {
  const [game, setGame] = useState(new Chess());

  function makeAMove(move: { from: string; to: string; promotion?: string }) {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      setGame(gameCopy);
      return result;
    } catch (e) {
      return null;
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });
    return move !== null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-blue-400">Farzin Web App</h1>
      
      <div className="w-full max-w-[500px] shadow-2xl rounded-lg overflow-hidden">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop}
          customDarkSquareStyle={{ backgroundColor: '#4b7399' }}
          customLightSquareStyle={{ backgroundColor: '#eae9d2' }}
        />
      </div>
      
      <p className="mt-6 text-gray-400">تخته آماده است! یک حرکت انجام دهید.</p>
    </div>
  );
}

export default App;