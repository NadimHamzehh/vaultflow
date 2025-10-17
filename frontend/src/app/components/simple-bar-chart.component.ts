// src/app/components/simple-bar-chart.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-simple-bar-chart',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display:block; width:100%; }
    .wrap { width:100%; height:100%; }
    svg { width:100%; height:100%; display:block; }
    .bar { fill: rgba(137,87,229,.85); } /* accent primary-ish */
    .bar:hover { opacity:.9; }
    .axis { stroke: rgba(255,255,255,.08); stroke-width:1; }
    .label { fill: var(--text-secondary); font-size: 10px; }
    .grid { stroke: rgba(255,255,255,.06); stroke-width:1; }
  `],
  template: `
    <div class="wrap" [style.minHeight.px]="height">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="none">
        <!-- X axis -->
        <line class="axis" [attr.x1]="paddingLeft" [attr.y1]="height - paddingBottom"
              [attr.x2]="width - paddingRight" [attr.y2]="height - paddingBottom"></line>

        <!-- Horizontal grid (5 lines) -->
        <ng-container *ngFor="let y of gridLines">
          <line class="grid"
                [attr.x1]="paddingLeft"
                [attr.y1]="y"
                [attr.x2]="width - paddingRight"
                [attr.y2]="y"></line>
        </ng-container>

        <!-- Bars -->
        <ng-container *ngIf="values && values.length; else empty">
          <ng-container *ngFor="let v of values; index as i">
            <rect class="bar"
              [attr.x]="barX(i)"
              [attr.y]="barY(v)"
              [attr.width]="barWidth"
              [attr.height]="barH(v)"
              rx="4" ry="4">
            </rect>
          </ng-container>
        </ng-container>
        <ng-template #empty>
          <text class="label" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">
            No data
          </text>
        </ng-template>
      </svg>
    </div>
  `
})
export class SimpleBarChartComponent {
  @Input() values: number[] = [];
  @Input() height = 320;

  // internal drawing config
  width = 800;               // viewBox width, responsive via preserveAspectRatio
  paddingLeft = 30;
  paddingRight = 10;
  paddingTop = 10;
  paddingBottom = 24;

  get innerW() { return this.width - this.paddingLeft - this.paddingRight; }
  get innerH() { return this.height - this.paddingTop - this.paddingBottom; }

  get maxV() {
    const m = Math.max(0, ...this.values);
    return m <= 0 ? 1 : m;   // avoid /0
  }

  get barWidth(): number {
    const n = Math.max(1, this.values.length);
    const gap = 4; // px gap between bars
    return Math.max(2, (this.innerW - gap * (n - 1)) / n);
  }

  barX(idx: number): number {
    const gap = 4;
    return this.paddingLeft + idx * (this.barWidth + gap);
    }

  barH(v: number): number {
    const h = (v / this.maxV) * this.innerH;
    return Math.max(1, h);
  }

  barY(v: number): number {
    const h = this.barH(v);
    return this.paddingTop + (this.innerH - h);
  }

  // 5 equally spaced grid lines inside chart area
  get gridLines(): number[] {
    const lines = 5;
    return Array.from({ length: lines }, (_, i) =>
      this.paddingTop + (i * this.innerH) / (lines - 1)
    );
  }
}
