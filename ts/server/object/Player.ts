import Peer from "peerjs";

let playerId = 0;

export function nextPlayerId(): number {
  playerId++;
  return playerId;
}

export default interface Player {
  name: string;
  connection: Peer.DataConnection;
  key: number;
}
