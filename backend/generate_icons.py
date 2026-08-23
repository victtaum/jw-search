import os
from PIL import Image, ImageDraw

def render_icon(size=1024, is_round=False):
    # Render at 4x for smooth antialiasing
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    bg_color = (30, 41, 59, 255) # Slate 800 (#1E293B)
    icon_color = (147, 197, 253, 255) # Light Blue 300 (#93C5FD)
    icon_accent = (96, 165, 250, 255) # Blue 400 (#60A5FA)
    
    # 1. Background
    if is_round:
        draw.ellipse([0, 0, canvas_size, canvas_size], fill=bg_color)
    else:
        # Rounded squircle
        corner_r = int(canvas_size * 0.22)
        draw.rounded_rectangle([0, 0, canvas_size, canvas_size], radius=corner_r, fill=bg_color)
        
    # 2. Person / Reader Circle at Top
    cx = canvas_size / 2
    head_cy = canvas_size * 0.32
    head_r = canvas_size * 0.12
    draw.ellipse([cx - head_r, head_cy - head_r, cx + head_r, head_cy + head_r], fill=icon_color)
    
    # 3. Open Book Wings
    # Left page
    gap = canvas_size * 0.02
    book_top = canvas_size * 0.48
    book_bottom = canvas_size * 0.72
    book_left = canvas_size * 0.18
    book_right = canvas_size * 0.82
    
    # Left Wing polygon
    left_pts = [
        (cx - gap, book_top + canvas_size * 0.04), # top-center spine
        (book_left + canvas_size * 0.04, book_top), # top-left
        (book_left, book_bottom - canvas_size * 0.04), # bottom-left
        (cx - gap, book_bottom), # bottom-center spine
    ]
    # Right Wing polygon
    right_pts = [
        (cx + gap, book_top + canvas_size * 0.04), # top-center spine
        (book_right - canvas_size * 0.04, book_top), # top-right
        (book_right, book_bottom - canvas_size * 0.04), # bottom-right
        (cx + gap, book_bottom), # bottom-center spine
    ]
    
    draw.polygon(left_pts, fill=icon_color)
    draw.polygon(right_pts, fill=icon_color)
    
    # Smooth corners by drawing circles at vertices
    r_corner = canvas_size * 0.035
    for p in left_pts:
        draw.ellipse([p[0]-r_corner, p[1]-r_corner, p[0]+r_corner, p[1]+r_corner], fill=icon_color)
    for p in right_pts:
        draw.ellipse([p[0]-r_corner, p[1]-r_corner, p[0]+r_corner, p[1]+r_corner], fill=icon_color)

    # Downsample with Lanczos for anti-aliasing
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

# Output directories
android_res = "android/app/src/main/res"
web_icons = "web/icons"
os.makedirs(web_icons, exist_ok=True)

# Android Mipmap sizes
mipmap_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, s in mipmap_sizes.items():
    f_path = os.path.join(android_res, folder)
    os.makedirs(f_path, exist_ok=True)
    
    # Square
    img_sq = render_icon(size=s, is_round=False)
    img_sq.save(os.path.join(f_path, "ic_launcher.png"), "PNG")
    
    # Round
    img_rd = render_icon(size=s, is_round=True)
    img_rd.save(os.path.join(f_path, "ic_launcher_round.png"), "PNG")

# Web Icons
img_192 = render_icon(size=192, is_round=False)
img_192.save("web/icons/icon-192.png", "PNG")

img_512 = render_icon(size=512, is_round=False)
img_512.save("web/icons/icon-512.png", "PNG")

img_apple = render_icon(size=180, is_round=False)
img_apple.save("web/icons/apple-touch-icon.png", "PNG")

img_fav = render_icon(size=64, is_round=False)
img_fav.save("web/favicon.png", "PNG")
img_fav.save("web/favicon.ico", "ICO")

print("All icons generated successfully for Android and Web!")
