import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainTableComponent } from './components/main-table/main-table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'doc-desk';
}
