from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MoveRequest(BaseModel):
    fen: str
    source: str
    target: str

@app.post("/validate_move")
def validate_move(request: MoveRequest):
    if request.fen == "start":
        board = chess.Board()
    else:
        board = chess.Board(request.fen)
    
    uci_move = request.source + request.target
    
    try:
        promo_move = chess.Move.from_uci(uci_move + "q")
        if promo_move in board.legal_moves:
            board.push(promo_move)
            return {"valid": True, "fen": board.fen()}
            
        normal_move = chess.Move.from_uci(uci_move)
        if normal_move in board.legal_moves:
            board.push(normal_move)
            return {"valid": True, "fen": board.fen()}
            
        return {"valid": False, "fen": request.fen}
    except ValueError:
        return {"valid": False, "fen": request.fen}