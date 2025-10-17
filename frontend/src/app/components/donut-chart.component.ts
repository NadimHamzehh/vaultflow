import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

type Slice = { label: string; value: number };

@Component({
  standalone: true,
  selector: 'app-donut-chart',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display:block; width:100%; height:100%; }
    .wrap { width:100%; height:100%; display:grid; grid-template-columns: 1fr 240px; gap:14px; }
    @media (max-width: 900px){ .wrap{ grid-template-columns: 1fr; } }
    svg { width:100%; height:100%; display:block; }
    .legend { display:flex; flex-direction:column; gap:10px; }
    .row { display:flex; align-items:center; gap:10px; }
    .sw { width:12px; height:12px; border-radius:3px; border:1px solid rgba(255,255,255,.25); }
    .label { color: var(--text-secondary); font-size:.92rem; }
    .val { font-weight:700; }
  `],
  template: `
    <div class="wrap" *ngIf="total > 0; else empty">
      <svg viewBox="0 0 220 220" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  [attr.stop-color]="c1"></stop>
            <stop offset="100%" [attr.stop-color]="c2"></stop>
          </linearGradient>
          <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%"  [attr.stop-color]="c2"></stop>
            <stop offset="100%" [attr.stop-color]="c1"></stop>
          </linearGradient>
        </defs>
        <g transform="translate(110,110)">
          <ng-container *ngFor="let s of norm; index as i">
            <circle
              [attr.stroke]="i % 2 === 0 ? 'url(#g1)' : 'url(#g2)'"
              fill="transparent"
              [attr.r]="radius"
              [attr.stroke-width]="thick"
              [attr.stroke-dasharray]="dash(s)"
              [attr.stroke-dashoffset]="offset(i)"/>
          </ng-container>

          <!-- center label -->
          <text x="0" y="-2" text-anchor="middle" fill="var(--text-primary)" style="font: 700 16px Inter">Total</text>
          <text x="0" y="18" text-anchor="middle" fill="var(--text-secondary)" style="font: 600 14px Inter">
            {{ total | number:'1.0-0' }}
          </text>
        </g>
      </svg>

      <div class="legend">
        <div class="row" *ngFor="let s of slices; let i = index">
          <div class="sw" [style.background]="i%2===0 ? 'var(--accent-primary)' : 'var(--accent-secondary)'"></div>
          <div class="label">{{ s.label }}</div>
          <div class="spacer" style="flex:1"></div>
          <div class="val">{{ s.value | number }}</div>
        </div>
      </div>
    </div>
    <ng-template #empty><div class="small muted">No data</div></ng-template>
  `
})
export class DonutChartComponent {
  @Input() slices: Slice[] = [];

  radius = 86;
  thick = 22;

  get total() { return this.slices.reduce((a,b)=>a + (b.value||0), 0); }
  get norm()   { return this.slices.map(s => (s.value||0) / (this.total || 1)); }

  get c1() { return this.css('--accent-primary') || '#8957e5'; }
  get c2() { return this.css('--accent-secondary') || '#ec4899'; }

  dash(n: number) {
    const C = 2 * Math.PI * this.radius;
    return `${C * n} ${C * (1-n)}`;
  }
  offset(i: number) {
    const C = 2 * Math.PI * this.radius;
    const acc = this.norm.slice(0, i).reduce((a,b)=>a+b,0);
    return C * (1 - acc);
    // (1 - acc) makes slices start at the top
  }

  css(name: string) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
}
