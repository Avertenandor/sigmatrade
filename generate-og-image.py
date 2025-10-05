"""
SigmaTrade YouTube-Style OG Image Generator
Creates professional 1200x630 preview image
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

# Image dimensions (YouTube/OG standard)
WIDTH = 1200
HEIGHT = 630

# Colors (matching website design)
BG_DARK = (15, 23, 42)  # #0f172a
BG_LIGHT = (30, 41, 59)  # #1e293b
BLUE = (59, 130, 246)  # #3b82f6
PURPLE = (139, 92, 246)  # #8b5cf6
GREEN = (16, 185, 129)  # #10b981
ORANGE = (245, 158, 11)  # #f59e0b
WHITE = (255, 255, 255)
GRAY = (148, 163, 184)  # #94a3b8

def create_gradient_background():
    """Create gradient background"""
    img = Image.new('RGB', (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    
    # Create gradient effect
    for y in range(HEIGHT):
        # Calculate color interpolation
        ratio = y / HEIGHT
        r = int(BG_DARK[0] + (BG_LIGHT[0] - BG_DARK[0]) * ratio)
        g = int(BG_DARK[1] + (BG_LIGHT[1] - BG_DARK[1]) * ratio)
        b = int(BG_DARK[2] + (BG_LIGHT[2] - BG_DARK[2]) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
    
    return img

def add_glow_effect(img, x, y, size, color, intensity=30):
    """Add glow effect around a point"""
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    for i in range(intensity, 0, -1):
        alpha = int(255 * (i / intensity) * 0.1)
        current_size = size + (intensity - i) * 2
        draw.ellipse(
            [x - current_size//2, y - current_size//2, 
             x + current_size//2, y + current_size//2],
            fill=(*color, alpha)
        )
    
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, overlay)
    return img.convert('RGB')

def create_og_image():
    """Create the main OG image"""
    print("🎨 Creating YouTube-style preview...")
    
    # Create base gradient
    img = create_gradient_background()
    draw = ImageDraw.Draw(img)
    
    # Add glow effects
    print("✨ Adding glow effects...")
    img = add_glow_effect(img, 200, 150, 300, BLUE, 40)
    img = add_glow_effect(img, 1000, 500, 300, PURPLE, 40)
    
    # Create new draw after effects
    draw = ImageDraw.Draw(img)
    
    # Try to load fonts (with fallbacks)
    try:
        # Try system fonts
        font_logo = ImageFont.truetype("arial.ttf", 60)
        font_brand = ImageFont.truetype("arialbd.ttf", 52)
        font_tagline = ImageFont.truetype("arial.ttf", 24)
        font_title = ImageFont.truetype("arialbd.ttf", 68)
        font_subtitle = ImageFont.truetype("arial.ttf", 32)
        font_bot = ImageFont.truetype("arialbd.ttf", 22)
        font_status = ImageFont.truetype("arial.ttf", 16)
        font_stat_value = ImageFont.truetype("arialbd.ttf", 36)
        font_stat_label = ImageFont.truetype("arial.ttf", 16)
        font_badge = ImageFont.truetype("arialbd.ttf", 24)
    except:
        # Fallback to default
        font_logo = ImageFont.load_default()
        font_brand = ImageFont.load_default()
        font_tagline = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_bot = ImageFont.load_default()
        font_status = ImageFont.load_default()
        font_stat_value = ImageFont.load_default()
        font_stat_label = ImageFont.load_default()
        font_badge = ImageFont.load_default()
    
    # Draw logo background (rounded rectangle simulation with circle)
    print("🎨 Drawing logo...")
    logo_x, logo_y = 80, 60
    logo_size = 80
    draw.ellipse(
        [logo_x - logo_size//2, logo_y - logo_size//2,
         logo_x + logo_size//2, logo_y + logo_size//2],
        fill=BLUE, outline=PURPLE, width=3
    )
    
    # Draw Sigma symbol
    draw.text((logo_x, logo_y), "Σ", fill=WHITE, font=font_logo, anchor="mm")
    
    # Draw brand name
    print("📝 Adding text...")
    draw.text((180, 60), "SIGMATRADE", fill=WHITE, font=font_brand)
    draw.text((180, 95), "Trading Bots Family", fill=GRAY, font=font_tagline)
    
    # Draw main title
    draw.text((80, 200), "Мониторинг семейства", fill=WHITE, font=font_title)
    draw.text((80, 270), "торговых ботов", fill=WHITE, font=font_title)
    draw.text((80, 340), "Реальное время | Балансы | Транзакции | BSC", 
              fill=GRAY, font=font_subtitle)
    
    # Draw bot cards
    print("🤖 Drawing bot cards...")
    card_y = 410
    card_height = 80
    card_width = 330
    
    # Exchange Bot (Active)
    card1_x = 80
    draw.rectangle([card1_x, card_y, card1_x + card_width, card_y + card_height],
                   outline=GREEN, width=2)
    draw.text((card1_x + 20, card_y + 15), "🔄", fill=WHITE, font=font_logo)
    draw.text((card1_x + 90, card_y + 20), "Exchange Bot", fill=WHITE, font=font_bot)
    draw.ellipse([card1_x + 90, card_y + 50, card1_x + 100, card_y + 60], fill=GREEN)
    draw.text((card1_x + 110, card_y + 48), "Активен", fill=GREEN, font=font_status)
    
    # MEV Bot (Dev)
    card2_x = 440
    draw.rectangle([card2_x, card_y, card2_x + card_width, card_y + card_height],
                   outline=ORANGE, width=2)
    draw.text((card2_x + 20, card_y + 15), "⚡", fill=WHITE, font=font_logo)
    draw.text((card2_x + 90, card_y + 20), "MEV Bot", fill=WHITE, font=font_bot)
    draw.ellipse([card2_x + 90, card_y + 50, card2_x + 100, card_y + 60], fill=ORANGE)
    draw.text((card2_x + 110, card_y + 48), "В разработке", fill=ORANGE, font=font_status)
    
    # Arbitrage Bot (Dev)
    card3_x = 800
    draw.rectangle([card3_x, card_y, card3_x + card_width, card_y + card_height],
                   outline=ORANGE, width=2)
    draw.text((card3_x + 20, card_y + 15), "💹", fill=WHITE, font=font_logo)
    draw.text((card3_x + 90, card_y + 20), "Arbitrage Bot", fill=WHITE, font=font_bot)
    draw.ellipse([card3_x + 90, card_y + 50, card3_x + 100, card_y + 60], fill=ORANGE)
    draw.text((card3_x + 110, card_y + 48), "В разработке", fill=ORANGE, font=font_status)
    
    # Draw footer stats
    print("📊 Adding statistics...")
    stats_y = 560
    draw.text((80, stats_y), "3", fill=BLUE, font=font_stat_value)
    draw.text((80, stats_y + 30), "БОТА", fill=GRAY, font=font_stat_label)
    
    draw.text((200, stats_y), "4", fill=BLUE, font=font_stat_value)
    draw.text((200, stats_y + 30), "ТОКЕНА", fill=GRAY, font=font_stat_label)
    
    draw.text((320, stats_y), "Real-time", fill=BLUE, font=font_stat_value)
    draw.text((320, stats_y + 30), "МОНИТОРИНГ", fill=GRAY, font=font_stat_label)
    
    # Draw 24/7 badge
    badge_x = 920
    badge_y = 555
    badge_width = 260
    badge_height = 50
    draw.rounded_rectangle(
        [badge_x, badge_y, badge_x + badge_width, badge_y + badge_height],
        radius=12, fill=GREEN
    )
    draw.text((badge_x + badge_width//2, badge_y + badge_height//2), 
              "24/7 МОНИТОРИНГ", fill=WHITE, font=font_badge, anchor="mm")
    
    return img

def main():
    """Main function"""
    print("\n" + "="*60)
    print("🚀 SIGMATRADE OG IMAGE GENERATOR")
    print("="*60 + "\n")
    
    # Create image
    img = create_og_image()
    
    # Save image
    output_path = "og-image.jpg"
    print(f"\n💾 Saving image to: {output_path}")
    img.save(output_path, "JPEG", quality=90, optimize=True)
    
    # Get file size
    file_size = os.path.getsize(output_path)
    file_size_kb = file_size / 1024
    
    print(f"\n✅ SUCCESS!")
    print(f"📁 File: {output_path}")
    print(f"📏 Size: {WIDTH}×{HEIGHT} pixels")
    print(f"💾 Weight: {file_size_kb:.1f} KB")
    print(f"🎯 Quality: HIGH (YouTube-style)")
    
    print("\n" + "="*60)
    print("🎉 READY TO DEPLOY!")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
