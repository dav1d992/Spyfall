import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { SessionService } from "../../services/session.service";
import { Component, inject } from "@angular/core";

@Component({
	selector: "app-create-session",
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: "./create-session.component.html",
	styleUrl: "./create-session.component.scss",
})
export class CreateSessionComponent {
	name = "";
	joinUrl: string | null = null;
	private router = inject(Router);
	private service = inject(SessionService);
	sessionId: string | null = null;
	interactionHandled = false;

	create() {
		if (this.name === "") return;
		this.service.createSession().then((sessionId) => {
			this.sessionId = sessionId;
			this.joinUrl = `${window.location.origin}/join/${sessionId}`;
			this.service.joinSession(this.sessionId, this.name, true).then(() => {
				this.router.navigate(["/session", this.sessionId]);
			});
		});
	}
}
