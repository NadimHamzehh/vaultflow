import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-bar-chart',
  imports: [CommonModule],
  styles: [`
    :host { display:block; }
    .wrap {
      position: relative;
      inline-size: 100%;
      block-size: 320px;               /* height */
      padding: 8px 8px 24px 8px;        /* room for x labels */
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 12px;
    }
    svg { inline-size: 100%; block-size: 100%; display:block; }
    .grid line {
      stroke: rgba(255,255,255,.08);
      stroke-width: 1;
      shape-rendering: crispEdges;
    }
    .bar {
      fill: url(#g);
      transition: y .2s ease, height .2s ease;
    }
    .bar:hover { filter: brightness(1.08); }
    .xlabel {
      fill: var(--text-secondary);
      font-size: 11px;
      dominant-baseline: hanging;
      text-anchor: middle;
    }
    .ylabel {
      fill: var(--text-secondary);
      font-size: 11px;
      dominant-baseline: middle;
      text-anchor: end;
    }
  `],
  template: `
    <div class="wrap" *ngIf="vals.length; else empty">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="none">
        <!-- defs for gradient bars -->
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  [attr.stop-color]="accentTop"/>
            <stop offset="100%" [attr.stop-color]="accentBottom"/>
          </linearGradient>
        </defs>

        <!-- horizontal grid lines -->
        <g class="grid">
          <line *ngFor="let gy of gridYs" [attr.x1]="padL" [attr.x2]="width - padR"
                [attr.y1]="gy" [attr.y2]="gy"></line>
        </g>

        <!-- y-axis labels -->
        <g>
          <text *ngFor="let y of yTicks; let i=index"
                class="ylabel"
                [attr.x]="padL - 6"
                [attr.y]="gridYs[i]">{{ y }}</text>
        </g>

        <!-- bars -->
        <g>
          <rect *ngFor="let b of bars"
                class="bar"
                [attr.x]="b.x" [attr.y]="b.y"
                [attr.width]="b.w" [attr.height]="b.h" rx="6" ry="6"></rect>
        </g>

        <!-- x-axis labels -->
        <g>
          <text *ngFor="let b of bars; let i=index"
                class="xlabel"
                [attr.x]="b.x + b.w/2"
                [attr.y]="height - padB + 6">
            {{ safeLabel(i) }}
          </text>
        </g>
      </svg>
    </div>

    <ng-template #empty>
      <div class="wrap" style="display:grid;place-items:center;color:var(--text-secondary);font-size:13px">
        No data
      </div>
    </ng-template>
  `
})
export class BarChartComponent implements OnChanges {
  @Input() values: number[] = [];
  @Input() labels: string[] = [];

  // theme accents (match your CSS variables)
  accentTop    = '#a98cf1';
  accentBottom = '#8957e5';

  // internal
  vals: number[] = [];
  width = 800;
  height = 300;

  padL = 44;
  padR = 8;
  padT = 10;
  padB = 28;

  bars: Array<{x:number;y:number;w:number;h:number}> = [];
  yTicks: string[] = [];
  gridYs: number[] = [];

  ngOnChanges(_: SimpleChanges) {
    // sanitize + copy
    this.vals = Array.isArray(this.values) ? this.values.map(v => Number(v) || 0) : [];
    this.compute();
  }

  private compute() {
    const innerW = this.width  - this.padL - this.padR;
    const innerH = this.height - this.padT - this.padB;

    const n   = this.vals.length;
    const max = Math.max(1, ...this.vals.map(v => Math.abs(v)));

    // ticks: 5 steps
    const steps = 5;
    this.yTicks = Array.from({length: steps+1}, (_,i) => {
      const v = Math.round((max * (steps - i)) / steps);
      return this.formatNum(v);
    });
    this.gridYs = this.yTicks.map((_,i) => this.padT + (innerH * i) / steps);

    // bar sizing
    const gap = Math.max(6, Math.min(18, innerW / Math.max(1, n) / 3));
    const barW = n ? (innerW - gap*(n-1)) / n : 0;

    this.bars = this.vals.map((v, i) => {
      const x = this.padL + i * (barW + gap);
      const h = (Math.abs(v) / max) * innerH;
      const y = this.padT + (innerH - h);
      return { x, y, w: barW, h };
    });
  }

  safeLabel(i: number): string {
    const lbl = this.labels?.[i];
    if (!lbl) return '';
    return lbl.length > 6 ? (lbl.slice(0,5) + '…') : lbl;
  }

  private formatNum(n: number): string {
    if (n >= 1_000_000) return (n/1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n/1_000).toFixed(1) + 'k';
    return String(n);
  }
}
