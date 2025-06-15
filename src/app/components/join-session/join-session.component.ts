import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-join-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-session.component.html',
  styleUrl: './join-session.component.scss',
})
export class JoinSessionComponent {
  name = '';
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(SessionService);

  join() {
    if (this.name === '') return;

    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (!sessionId) {
      console.error('Session ID is required');
      return;
    }
    this.service.joinSession(sessionId, this.name).then(() => {
      this.router.navigate(['/session', sessionId]);
    });
  }
}
