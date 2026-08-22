import os

icons_dir = "c:/Dev/JW Search/web/icons"
os.makedirs(icons_dir, exist_ok=True)

# 1x1 transparent PNG pixel byte literal
png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'

for size in [192, 512]:
    file_path = os.path.join(icons_dir, f"icon-{size}.png")
    with open(file_path, "wb") as f:
        f.write(png_data)
    print(f"Generated placeholder PWA icon: {file_path}")
