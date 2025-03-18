import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainTableComponent } from './components/main-table/main-table.component';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainTableComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'doc-desk';
}
