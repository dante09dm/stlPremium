// Minimal stub of @ant-design/colors for build compatibility
// Only `generate` is used by @ant-design/icons
export function generate(color) {
  // Return 10 shades (ant design palette format) — simple approximation
  return Array.from({ length: 10 }, (_, i) => color || '#1890ff');
}

export const red    = ['#fff1f0','#ffccc7','#ffa39e','#ff7875','#ff4d4f','#f5222d','#cf1322','#a8071a','#820014','#5c0011'];
export const blue   = ['#e6f7ff','#bae7ff','#91d5ff','#69c0ff','#40a9ff','#1890ff','#096dd9','#0050b3','#003a8c','#002766'];
export const green  = ['#f6ffed','#d9f7be','#b7eb8f','#95de64','#73d13d','#52c41a','#389e0d','#237804','#135200','#092b00'];
