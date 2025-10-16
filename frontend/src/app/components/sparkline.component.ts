import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-sparkline',
  imports: [CommonModule],
  template: `
    <svg [attr.width]="width" [attr.height]="height" viewBox="0 0 100 20" preserveAspectRatio="none">
      <polyline [attr.points]="points" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" [attr.stroke]="color"></polyline>
    </svg>
  `,
  styles: [':host{display:inline-block;color:var(--accent);height:20px;width:100px}']
})
export class SparklineComponent {
  @Input() values: number[] = [];
  @Input() width = 100;
  @Input() height = 20;
  @Input() color = 'currentColor';

  get points(){
    if(!this.values || this.values.length===0) return '';
    const max = Math.max(...this.values);
    const min = Math.min(...this.values);
    const range = max - min || 1;
    return this.values.map((v,i)=>{
      const x = (i/(this.values.length-1))*100;
      const y = 20 - ((v-min)/range)*18 - 1; // pad
      return `${x},${y}`;
    }).join(' ');
  }
}
