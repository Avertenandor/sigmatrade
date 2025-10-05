import os
from pathlib import Path

# SVG content for icons
def create_svg_icon(size, is_og=False):
    if is_og:
        # OG Image 1200x630
        return f'''<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="50%" style="stop-color:#121212"/>
      <stop offset="100%" style="stop-color:#0a0a0a"/>
    </linearGradient>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g opacity="0.05" stroke="#00d4ff" stroke-width="1">
    {''.join(f'<line x1="{i}" y1="0" x2="{i}" y2="630"/>' for i in range(0, 1200, 40))}
    {''.join(f'<line x1="0" y1="{i}" x2="1200" y2="{i}"/>' for i in range(0, 630, 40))}
  </g>
  <g transform="translate(80, 150)">
    <path d="M 0,0 L 340,0 L 340,50 L 0,50 Z M 380,50 L 40,200 M 40,200 L 380,350 M 0,350 L 340,350 L 340,400 L 0,400 Z" 
          fill="url(#grad)" stroke="url(#grad)" stroke-width="35" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="550" y="280" font-family="Arial" font-size="110" font-weight="bold" fill="white">SigmaTrade</text>
  <text x="550" y="360" font-family="Arial" font-size="42" fill="#00d4ff">Real-time Blockchain Monitoring</text>
  <text x="550" y="420" font-family="Arial" font-size="28" fill="rgba(255,255,255,0.6)">Professional BSC Transaction Tracking</text>
  <rect x="30" y="30" width="1140" height="570" fill="none" stroke="rgba(0,212,255,0.2)" stroke-width="3"/>
</svg>'''
    else:
        # Regular icon
        margin = size * 0.1
        corner = size * 0.08 if size >= 180 else 0
        return f'''<svg width="{size}" height="{size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="{size}" height="{size}" fill="#0a0a0a"/>
  <g transform="translate({size*0.25}, {size*0.25})">
    <rect x="0" y="0" width="{size*0.5}" height="{size*0.05}" fill="url(#grad)"/>
    <line x1="{size*0.5}" y1="{size*0.025}" x2="{size*0.1}" y2="{size*0.25}" stroke="url(#grad)" stroke-width="{max(2, size/40)}" stroke-linecap="round"/>
    <line x1="{size*0.1}" y1="{size*0.25}" x2="{size*0.5}" y2="{size*0.475}" stroke="url(#grad)" stroke-width="{max(2, size/40)}" stroke-linecap="round"/>
    <rect x="0" y="{size*0.45}" width="{size*0.5}" height="{size*0.05}" fill="url(#grad)"/>
  </g>
  {f'<g stroke="rgba(0,212,255,0.2)" stroke-width="2" fill="none"><path d="M {margin},{margin} L {margin},{margin+corner} M {margin},{margin} L {margin+corner},{margin}"/><path d="M {size-margin},{margin} L {size-margin},{margin+corner} M {size-margin},{margin} L {size-margin-corner},{margin}"/><path d="M {margin},{size-margin} L {margin},{size-margin-corner} M {margin},{size-margin} L {margin+corner},{size-margin}"/><path d="M {size-margin},{size-margin} L {size-margin},{size-margin-corner} M {size-margin},{size-margin} L {size-margin-corner},{size-margin}"/></g>' if size >= 180 else ''}
</svg>'''

# Create SVG files
output_dir = Path(r"C:\Users\konfu\Desktop\sigmatrade.org")

icons = [
    (16, "favicon-16x16.svg"),
    (32, "favicon-32x32.svg"),
    (180, "apple-touch-icon.svg"),
    (192, "icon-192x192.svg"),
    (512, "icon-512x512.svg"),
]

print("🎨 Создание SVG иконок...")

for size, filename in icons:
    svg_content = create_svg_icon(size)
    filepath = output_dir / filename
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f"✅ Создан: {filename}")

# OG Image
og_content = create_svg_icon(1200, is_og=True)
og_path = output_dir / "og-image.svg"
with open(og_path, 'w', encoding='utf-8') as f:
    f.write(og_content)
print(f"✅ Создан: og-image.svg")

print("\n⚠️  ВНИМАНИЕ: Созданы SVG файлы.")
print("Для конвертации в PNG/JPG используйте:")
print("1. Онлайн: https://cloudconvert.com/svg-to-png")
print("2. Или откройте ALL-IN-ONE.html в браузере и скачайте")
