// Minimal stub of @ant-design/fast-color for build compatibility
export class FastColor {
  constructor(color) {
    this.r = 0; this.g = 0; this.b = 0; this.a = 1;
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      if (hex.length === 6) {
        this.r = parseInt(hex.slice(0, 2), 16);
        this.g = parseInt(hex.slice(2, 4), 16);
        this.b = parseInt(hex.slice(4, 6), 16);
      }
    }
  }
  toHexString() { return `#${[this.r,this.g,this.b].map(v=>v.toString(16).padStart(2,'0')).join('')}`; }
  toRgbString() { return `rgba(${this.r},${this.g},${this.b},${this.a})`; }
  clone() { const c = new FastColor('#000'); c.r=this.r; c.g=this.g; c.b=this.b; c.a=this.a; return c; }
  darken(n=10) { const c=this.clone(); c.r=Math.max(0,c.r-n*2.55|0); c.g=Math.max(0,c.g-n*2.55|0); c.b=Math.max(0,c.b-n*2.55|0); return c; }
  lighten(n=10) { const c=this.clone(); c.r=Math.min(255,c.r+n*2.55|0); c.g=Math.min(255,c.g+n*2.55|0); c.b=Math.min(255,c.b+n*2.55|0); return c; }
  setAlpha(a) { const c=this.clone(); c.a=a; return c; }
  isValid() { return true; }
  get isLight() { return (this.r*299+this.g*587+this.b*114)/1000 >= 128; }
}
