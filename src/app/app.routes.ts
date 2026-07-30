import type { Routes } from '@angular/router';
import { CreateSessionComponent } from './components/create-session/create-session.component';
import { JoinSessionComponent } from './components/join-session/join-session.component';
import { GameBoardComponent } from './components/game-board/game-board.component';

export const routes: Routes = [
  { path: '', component: CreateSessionComponent, title: 'Spyfall' },
  {
    path: 'join/:sessionId',
    component: JoinSessionComponent,
    title: 'Join · Spyfall',
  },
  {
    path: 'session/:sessionId',
    component: GameBoardComponent,
    title: 'Game · Spyfall',
  },
  { path: '**', redirectTo: '' },
];
