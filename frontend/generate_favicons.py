import os
from PIL import Image, ImageDraw

def create_favicon(size):
    # Scale coordinates relative to 64x64
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    scale = size / 64.0
    rx = max(1, int(6 * scale))
    
    # Draw rounded square #111111
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=rx, fill=(17, 17, 17, 255))
    
    # Path M14 11H52V23H26V29H43V41H26V53H14Z
    # Polygon points scaled:
    # (14, 11) -> (52, 11) -> (52, 23) -> (26, 23) -> (26, 29) -> (43, 29) -> (43, 41) -> (26, 41) -> (26, 53) -> (14, 53)
    points_64 = [
        (14, 11),
        (52, 11),
        (52, 23),
        (26, 23),
        (26, 29),
        (43, 29),
        (43, 41),
        (26, 41),
        (26, 53),
        (14, 53),
    ]
    scaled_points = [(p[0] * scale, p[1] * scale) for p in points_64]
    
    draw.polygon(scaled_points, fill=(255, 255, 255, 255))
    return img

public_dir = os.path.join(os.path.dirname(__file__), "public")

# 180x180 apple-touch-icon.png
apple_icon = create_favicon(180)
apple_icon.save(os.path.join(public_dir, "apple-touch-icon.png"))

# 32x32 / 48x48 favicon.png
fav_png = create_favicon(48)
fav_png.save(os.path.join(public_dir, "favicon.png"))

# favicon.ico with 16, 32, 48 px sizes
ico_16 = create_favicon(16)
ico_32 = create_favicon(32)
ico_48 = create_favicon(48)
ico_16.save(
    os.path.join(public_dir, "favicon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[ico_32, ico_48]
)

print("Favicons generated successfully!")
