import type { Routes } from '@angular/router';
import { CreateSessionComponent } from './components/create-session/create-session.component';
import { JoinSessionComponent } from './components/join-session/join-session.component';
import { GameBoardComponent } from './components/game-board/game-board.component';

export const routes: Routes = [
  { path: '', component: CreateSessionComponent },
  { path: 'join/:sessionId', component: JoinSessionComponent },
  { path: 'session/:sessionId', component: GameBoardComponent },
];
