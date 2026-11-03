"""Genera los diagramas de arquitectura y flujo FEFO para el informe final."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "img"
OUT.mkdir(exist_ok=True)

RED = "#e63946"
DARK = "#0f172a"
SLATE = "#475569"
MUTED = "#64748b"
BORDER = "#cbd5e1"
GREEN = "#0f9f6e"
BLUE = "#0ea5e9"
AMBER = "#d97706"
BG = "#f8fafc"
WHITE = "#ffffff"


def font(size, bold=False):
    candidates = [
        Path("C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def center_text(draw, box, text, fnt, fill=DARK):
    left, top, right, bottom = box
    bbox = draw.textbbox((0, 0), text, font=fnt)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    draw.text(
        (left + (right - left - width) / 2, top + (bottom - top - height) / 2),
        text,
        font=fnt,
        fill=fill,
    )


def box(draw, xy, title, lines, accent, width=2):
    draw.rounded_rectangle(xy, radius=24, fill=WHITE, outline=accent, width=width)
    left, top, right, bottom = xy
    draw.rounded_rectangle((left, top, right, top + 58), radius=24, fill=accent)
    draw.rectangle((left, top + 38, right, top + 58), fill=accent)
    center_text(draw, (left, top, right, top + 58), title, font(27, True), WHITE)
    y = top + 82
    for line in lines:
        draw.text((left + 22, y), line, font=font(21), fill=SLATE)
        y += 31


def arrow(draw, start, end, color=DARK, width=4, label=None, label_offset=(0, -22)):
    draw.line([start, end], fill=color, width=width)
    x1, y1 = start
    x2, y2 = end
    if abs(x2 - x1) >= abs(y2 - y1):
        direction = 1 if x2 > x1 else -1
        points = [(x2, y2), (x2 - direction * 16, y2 - 9), (x2 - direction * 16, y2 + 9)]
    else:
        direction = 1 if y2 > y1 else -1
        points = [(x2, y2), (x2 - 9, y2 - direction * 16), (x2 + 9, y2 - direction * 16)]
    draw.polygon(points, fill=color)
    if label:
        mid = ((x1 + x2) / 2 + label_offset[0], (y1 + y2) / 2 + label_offset[1])
        bbox = draw.textbbox((0, 0), label, font=font(17, True))
        draw.rounded_rectangle(
            (mid[0] - (bbox[2] - bbox[0]) / 2 - 9, mid[1] - 13,
             mid[0] + (bbox[2] - bbox[0]) / 2 + 9, mid[1] + 17),
            radius=7, fill=BG, outline=BORDER, width=1,
        )
        center_text(
            draw,
            (mid[0] - (bbox[2] - bbox[0]) / 2 - 9, mid[1] - 13,
             mid[0] + (bbox[2] - bbox[0]) / 2 + 9, mid[1] + 17),
            label, font(17, True), MUTED,
        )


def architecture():
    image = Image.new("RGB", (1640, 860), BG)
    draw = ImageDraw.Draw(image)
    draw.text((70, 42), "Arquitectura de la solución Nova Salud", font=font(42, True), fill=DARK)
    draw.text(
        (72, 98),
        "Aplicación web SPA + API REST + base de datos relacional",
        font=font(23), fill=MUTED,
    )

    box(draw, (70, 300, 300, 500), "Usuarios", [
        "• Administrador",
        "• Vendedor",
        "• Navegador web",
    ], RED)

    box(draw, (390, 210, 760, 590), "Frontend React SPA", [
        "• Vite + React 19",
        "• React Router",
        "• Bootstrap 5 + CSS",
        "• Formik + Yup",
        "• Axios + JWT",
        "• Chart.js",
        "• Diseño responsive",
    ], BLUE)

    box(draw, (850, 210, 1220, 590), "API REST Express", [
        "• Node.js + Express 5",
        "• Autenticación JWT",
        "• Roles y permisos",
        "• Validaciones de entrada",
        "• Ventas FEFO transaccionales",
        "• Reportes CSV / PDF",
        "• Carga de imágenes (Multer)",
    ], GREEN)

    box(draw, (1310, 250, 1570, 510), "MySQL", [
        "• bd_botica",
        "• medicamentos",
        "• lotes",
        "• ventas",
        "• movimientos",
    ], AMBER)

    box(draw, (850, 640, 1220, 790), "Archivos y evidencias", [
        "• Imágenes de medicamentos",
        "• Comprobantes PDF",
    ], SLATE)

    arrow(draw, (300, 400), (390, 400), label="HTTPS", label_offset=(0, -25))
    arrow(draw, (760, 400), (850, 400), label="JSON /api", label_offset=(0, -25))
    arrow(draw, (1220, 380), (1310, 380), label="SQL", label_offset=(0, -25))
    arrow(draw, (1035, 590), (1035, 640), label="uploads", label_offset=(90, 0))

    draw.text((70, 780), "Fuente: elaboración propia (2026).", font=font(18), fill=MUTED)
    image.save(OUT / "arquitectura_novasalud.png", quality=95)


def fefo():
    image = Image.new("RGB", (1240, 2220), BG)
    draw = ImageDraw.Draw(image)
    draw.text((70, 42), "Flujo transaccional de una venta FEFO", font=font(40, True), fill=DARK)
    draw.text(
        (72, 96),
        "First Expired, First Out: primero vence, primero sale",
        font=font(22), fill=MUTED,
    )

    x1, x2 = 120, 860
    box_height = 145
    step_gap = 195
    steps = [
        ("1. Carrito de venta", ["Productos y cantidades seleccionados"], BLUE),
        ("2. POST /api/ventas", ["Validación de sesión, rol y datos"], GREEN),
        ("3. Iniciar transacción", ["withTransaction() en MySQL"], AMBER),
        ("4. Bloquear lotes vigentes", ["SELECT ... FOR UPDATE", "Solo lotes habilitados y no vencidos"], RED),
    ]
    y = 170
    centers = []
    for title, lines, accent in steps:
        box(draw, (x1, y, x2, y + box_height), title, lines, accent)
        centers.append((x1, y, x2, y + box_height))
        y += step_gap

    # Decisión
    decision_y = y
    draw.rounded_rectangle((x1, decision_y, x2, decision_y + 130), radius=24, fill=WHITE, outline=RED, width=3)
    center_text(draw, (x1, decision_y, x2, decision_y + 130), "5. ¿Stock suficiente?", font(28, True), DARK)

    # Rama No
    draw.rounded_rectangle((930, decision_y + 10, 1160, decision_y + 120), radius=18, fill="#fff1f2", outline=RED, width=2)
    center_text(draw, (930, decision_y + 14, 1160, decision_y + 54), "NO: ROLLBACK", font(22, True), RED)
    center_text(draw, (930, decision_y + 56, 1160, decision_y + 104), "Error 409: stock insuficiente", font(16), SLATE)
    arrow(draw, (x2, decision_y + 65), (930, decision_y + 65), color=RED, label="No", label_offset=(0, -20))

    # Rama Sí
    next_y = decision_y + 190
    draw.text((x1 - 5, decision_y + 142), "Sí", font=font(22, True), fill=GREEN)
    arrow(draw, ((x1 + x2) / 2, decision_y + 130), ((x1 + x2) / 2, next_y), color=GREEN)

    steps2 = [
        ("6. Ordenar por vencimiento", ["ORDER BY fecha_vencimiento ASC, id ASC"], GREEN),
        ("7. Descontar por lote", ["Se agota el lote más próximo antes de pasar al siguiente"], BLUE),
        ("8. Registrar trazabilidad", ["ventas, detalle_ventas, detalle_venta_lotes", "y movimientos_inventario"], AMBER),
        ("9. COMMIT", ["La operación se confirma de forma atómica"], GREEN),
        ("10. Comprobante interno", ["Número de venta, detalle y lotes utilizados"], RED),
    ]
    y = next_y
    for title, lines, accent in steps2:
        box(draw, (x1, y, x2, y + box_height), title, lines, accent)
        y += step_gap

    draw.text((70, 2150), "Fuente: elaboración propia (2026).", font=font(18), fill=MUTED)
    image.save(OUT / "flujo_fefo.png", quality=95)


if __name__ == "__main__":
    architecture()
    fefo()
    print("Diagramas generados en", OUT)
