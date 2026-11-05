"""Completa el formato oficial del trabajo final con la propuesta Nova Salud.

Uso:
    py docs/llenar_formato.py

Genera:
    docs/FORMATO_TRABAJO_FINAL_LLENADO.docx
"""

from pathlib import Path

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from docx.text.paragraph import Paragraph

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "archivos" / "FORMATO.docx"
OUTPUT = ROOT / "docs" / "FORMATO_TRABAJO_FINAL_LLENADO.docx"
IMG = ROOT / "docs" / "img"

DARK = RGBColor(0x0F, 0x17, 0x2A)
SLATE = RGBColor(0x47, 0x55, 0x69)
MUTED = RGBColor(0x64, 0x74, 0x8B)
RED = RGBColor(0xE6, 0x39, 0x46)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

TOPIC = "Implementación de un software web de gestión de inventario y venta para la botica Nova Salud"
STUDENT = "[Apellidos y Nombres del estudiante]"


def clear_cell(cell):
    for child in list(cell._tc):
        if child.tag != qn("w:tcPr"):
            cell._tc.remove(child)


def style_run(run, size=9.5, bold=False, italic=False, color=SLATE):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = "Calibri"


def add_para(cell, text="", size=9.5, bold=False, italic=False, color=SLATE,
             align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=3,
             bullet=False, heading=False):
    paragraph = cell.add_paragraph()
    paragraph.alignment = align
    paragraph.paragraph_format.space_before = Pt(space_before)
    paragraph.paragraph_format.space_after = Pt(space_after)
    if bullet:
        paragraph.paragraph_format.left_indent = Inches(0.2)
        paragraph.paragraph_format.first_line_indent = Inches(-0.12)
        text = f"• {text}"
    if heading:
        size = max(size, 10.5)
        bold = True
        color = DARK
        space_before = max(space_before, 7)
        space_after = max(space_after, 3)
        paragraph.paragraph_format.keep_with_next = True
    run = paragraph.add_run(text)
    style_run(run, size=size, bold=bold, italic=italic, color=color)
    return paragraph


def add_image(cell, filename, width, caption=None):
    paragraph = cell.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(6)
    paragraph.paragraph_format.space_after = Pt(3)
    run = paragraph.add_run()
    run.add_picture(str(IMG / filename), width=Inches(width))
    if caption:
        cap = cell.add_paragraph()
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cap.paragraph_format.space_after = Pt(6)
        cap_run = cap.add_run(caption)
        style_run(cap_run, size=8.5, italic=True, color=MUTED)


def set_cell(cell, text, size=10, bold=False, color=SLATE,
             align=WD_ALIGN_PARAGRAPH.LEFT):
    clear_cell(cell)
    paragraph = cell.add_paragraph()
    paragraph.alignment = align
    paragraph.paragraph_format.space_after = Pt(0)
    run = paragraph.add_run(text)
    style_run(run, size=size, bold=bold, color=color)


def shade(cell, color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    tc_pr.append(shd)


def remove_cant_split(document):
    for table in document.tables:
        for row in table.rows:
            tr_pr = row._tr.get_or_add_trPr()
            cant_split = tr_pr.find(qn("w:cantSplit"))
            if cant_split is not None:
                tr_pr.remove(cant_split)


def remove_placeholder_shapes(document):
    """Quita los recuadros vacíos que trae la plantilla original."""
    placeholders = {"Rectángulo 13", "Rectángulo 3"}

    for paragraph in list(document.paragraphs):
        names = []
        for element in paragraph._p.iter():
            if not isinstance(element.tag, str):
                continue
            if element.tag.endswith("}docPr"):
                names.append(element.get("name"))

        if names and all(name in placeholders for name in names):
            parent = paragraph._p.getparent()
            if parent is not None:
                parent.remove(paragraph._p)


def mark_header_row(table, row_index):
    tr_pr = table.rows[row_index]._tr.get_or_add_trPr()
    if tr_pr.find(qn("w:tblHeader")) is None:
        tr_pr.append(OxmlElement("w:tblHeader"))


def set_checkbox(sdt, checked):
    """Marca o desmarca un control de casilla del formato original."""
    w14 = "http://schemas.microsoft.com/office/word/2010/wordml"

    for element in sdt.iter():
        if element.tag == f"{{{w14}}}checked":
            element.set(f"{{{w14}}}val", "1" if checked else "0")
        elif element.tag == qn("w:t"):
            element.text = "☒" if checked else "☐"


def fill_student_data(document):
    table = document.tables[0]
    set_cell(table.cell(0, 1), STUDENT, size=10, bold=True, color=DARK)
    set_cell(table.cell(0, 3), "[ID]", size=10, bold=True, color=DARK)
    set_cell(table.cell(1, 1), "[Dirección Zonal / CFP]", size=10, color=DARK)
    set_cell(table.cell(2, 1), "Ingeniería de Software con Inteligencia Artificial", size=10, color=DARK)
    set_cell(table.cell(2, 4), "V", size=10, bold=True, color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell(table.cell(3, 1), "Fullstack Developer Software", size=10, color=DARK)
    set_cell(table.cell(4, 1), TOPIC, size=10, bold=True, color=DARK)


def insert_para_after(anchor, text, size=10, bold=False, italic=False, color=SLATE,
                      align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=0, space_after=6):
    new_p = OxmlElement("w:p")
    anchor._p.addnext(new_p)
    paragraph = Paragraph(new_p, anchor._parent)
    paragraph.alignment = align
    paragraph.paragraph_format.space_before = Pt(space_before)
    paragraph.paragraph_format.space_after = Pt(space_after)
    run = paragraph.add_run(text)
    style_run(run, size=size, bold=bold, italic=italic, color=color)
    return paragraph


def insert_paras_after(anchor, texts):
    current = anchor
    for text in texts:
        current = insert_para_after(current, text)


def fill_paragraphs(document):
    paragraphs = document.paragraphs

    def find(prefix):
        for paragraph in paragraphs:
            if paragraph.text.strip().startswith(prefix):
                return paragraph
        raise ValueError(f"No se encontró el párrafo: {prefix}")

    problem_anchor = find("Identifica la problemática del caso práctico propuesto.")
    insert_paras_after(
        problem_anchor,
        [
            "La botica Nova Salud ha crecido, pero todavía anota el inventario y las ventas a mano. "
            "Eso trae problemas: el stock del cuaderno no siempre coincide con el stock real, algunos "
            "productos se acaban y no hay aviso, otros se vencen porque no se sabe qué lote sale primero, "
            "la atención es más lenta y no queda un historial claro de lo que se vendió. La botica necesita "
            "un solo sistema web que ordene los medicamentos, los lotes, el stock, las ventas y los avisos.",
            "Para resolverlo se migró la aplicación PHP a un sistema fullstack: React para la pantalla, "
            "Node.js con Express para la lógica y MySQL para los datos. El sistema mantiene el diseño de "
            "Nova Salud, tiene login con roles, vende primero el lote que vence antes (FEFO) y genera "
            "reportes en CSV y PDF.",
        ],
    )

    solution_anchor = find("Identifica propuesta de solución y evidencias.")
    insert_paras_after(
        solution_anchor,
        [
            "La solución es un sistema web llamado Nova Salud. Tiene una pantalla hecha en React, un "
            "servidor en Node.js/Express y una base de datos MySQL. Incluye login, panel, medicamentos, "
            "lotes, vencimientos, inventario, punto de venta, historial, comprobantes, reportes y usuarios.",
            "Las evidencias son: la API probada, la pantalla en React, la base de datos, las pruebas "
            "(17 de 17), una venta real con descuento de lote, el comprobante y los reportes CSV/PDF. "
            "Los detalles están en la propuesta y en las tablas de operaciones y normas.",
        ],
    )

    questions_anchor = find("Durante el análisis y estudio del caso práctico")
    insert_paras_after(
        questions_anchor,
        [
            "Las respuestas se presentan a continuación, relacionando el caso Nova Salud con las preguntas "
            "guía del trabajo final.",
        ],
    )

    schedule_anchor = find("Cronograma de actividades:")
    insert_paras_after(
        schedule_anchor,
        [
            "S1 a S6 son las seis semanas del trabajo. Cada X marca la semana en la que se hace la actividad.",
        ],
    )

    resources_anchor = find("Lista de recursos necesarios:")
    insert_paras_after(
        resources_anchor,
        [
            "Todos los recursos son gratuitos o ya están disponibles. No se necesita comprar licencias.",
        ],
    )

    operations_anchor = find("INSTRUCCIONES: Ser lo más explícito posible.")
    insert_paras_after(
        operations_anchor,
        [
            "Las operaciones siguen el ciclo del software y toman en cuenta la calidad, la seguridad, "
            "la salud y el medio ambiente.",
        ],
    )


def fill_questions(document):
    table = document.tables[1]
    questions = [
        "¿Cuáles son los principales desafíos operativos que enfrenta la botica Nova Salud debido a la falta de un sistema de gestión de inventarios automatizado?",
        "¿Qué características específicas debe incluir el software web para atender las necesidades de control de stock y atención al cliente en Nova Salud?",
        "¿De qué manera la implementación de un software web para la gestión de inventarios puede impactar en la reducción del desabastecimiento y la mejora del servicio al cliente?",
        "¿Qué beneficios adicionales, aparte del control de inventarios, podría ofrecer el software para incrementar la competitividad de Nova Salud en su mercado?",
        "¿Qué métricas se pueden utilizar para evaluar la efectividad del software en mejorar los tiempos de respuesta al cliente y reducir los errores en la gestión de inventario?",
    ]

    answers = [
        [
            ("Los problemas principales son:", True),
            ("El stock se anota a mano. El cuaderno no siempre coincide con lo que hay en el estante.", False),
            ("No hay avisos cuando un producto está por acabarse. A veces se compra tarde.", False),
            ("No se sabe qué lote vence primero. Algunos medicamentos se vencen y se pierde dinero.", False),
            ("No queda claro qué lote se vendió. Si hay un reclamo, es difícil revisar.", False),
            ("La atención es más lenta porque hay que buscar precio, stock y lote en varios lugares.", False),
            ("No hay reportes rápidos para saber qué se vende más o qué falta.", False),
            ("No hay roles ni claves personales. Todos pueden ver y cambiar todo.", False),
            ("El conocimiento queda en el personal y no en un sistema.", False),
            ("Si la botica crece, estos problemas aumentan.", False),
        ],
        [
            ("El software debe tener:", True),
            ("Login con usuario, contraseña y roles de administrador y vendedor.", False),
            ("Un panel con stock, ventas del día, productos por vencer y productos con poco stock.", False),
            ("Registro de medicamentos con precio, categoría, stock mínimo y foto.", False),
            ("Registro de lotes con fecha de vencimiento y cantidad.", False),
            ("Avisos de vencimiento y de stock bajo.", False),
            ("Inventario con entradas, salidas y ajustes.", False),
            ("Punto de venta rápido: buscar, agregar al carrito y confirmar.", False),
            ("Venta FEFO: sale primero el lote que vence antes.", False),
            ("Historial de ventas y comprobante.", False),
            ("Reportes en CSV y PDF.", False),
            ("Usuarios y configuración de avisos.", False),
            ("Diseño fácil de usar en computadora y celular.", False),
            ("Validaciones y seguridad en el servidor.", False),
        ],
        [
            ("El impacto se da así:", True),
            ("El stock se ve en tiempo real. Así se compra mejor y hay menos faltantes.", False),
            ("El sistema avisa cuando un producto está por acabarse o un lote está por vencer.", False),
            ("La venta FEFO saca primero lo que vence antes. Se pierde menos mercadería.", False),
            ("La atención es más rápida porque todo está en una sola pantalla.", False),
            ("El cliente encuentra más productos y espera menos.", False),
            ("Los reportes ayudan a decidir qué comprar y qué no.", False),
            ("Con estos controles baja el desabastecimiento y mejora el servicio.", False),
            ("El impacto se puede medir antes y después de usar el sistema.", False),
        ],
        [
            ("Beneficios adicionales:", True),
            ("Reportes para saber qué productos se venden más y cuánto se gana.", False),
            ("Mejor control de compras: se compra lo que realmente se necesita.", False),
            ("Menos papel y menos tiempo en tareas manuales.", False),
            ("Historial de quién vendió, cuándo y qué lote entregó.", False),
            ("Más seguridad con roles y claves personales.", False),
            ("El sistema puede crecer: facturación, proveedores o varias tiendas.", False),
            ("Mejor imagen para la botica.", False),
            ("Datos para negociar con proveedores y ajustar precios.", False),
            ("Menos desperdicio por vencimientos.", False),
            ("Capacitación más rápida por una pantalla simple.", False),
        ],
        [
            ("Métricas propuestas:", True),
            ("Productos agotados / productos activos. Meta: menos de 5%.", False),
            ("Diferencias de inventario / registros revisados. Meta: menos de 2%.", False),
            ("Unidades vencidas / unidades compradas. Meta: menos de 2%.", False),
            ("Tiempo promedio de una venta. Meta: menos de 1 minuto.", False),
            ("Ventas con error / total de ventas. Meta: menos de 1%.", False),
            ("Ventas que usan el lote más próximo a vencer / ventas con lote. Meta: 100%.", False),
            ("Tiempo que el sistema está disponible. Meta: más de 99%.", False),
            ("Tiempo de respuesta de la API. Meta: menos de 0.5 segundos.", False),
            ("Satisfacción del cliente. Meta: más de 85%.", False),
            ("Usuarios que usan el sistema / usuarios registrados. Meta: más de 90%.", False),
            ("Comparar antes y después a los 30, 60 y 90 días.", False),
        ],
    ]

    for index, question in enumerate(questions):
        question_row = index * 2
        answer_row = question_row + 1
        set_cell(table.cell(question_row, 0), f"Pregunta {index + 1:02d}:", size=10, bold=True, color=DARK)
        set_cell(table.cell(question_row, 1), question, size=9.8, bold=True, color=DARK)
        shade(table.cell(question_row, 0), "FDE2E4")
        shade(table.cell(question_row, 1), "FFF7F8")
        merged = table.cell(answer_row, 0).merge(table.cell(answer_row, 1))
        clear_cell(merged)
        for text, is_title in answers[index]:
            add_para(
                merged,
                text,
                size=9.4,
                bold=is_title,
                color=DARK if is_title else SLATE,
                bullet=not is_title,
                space_after=2,
            )


def fill_schedule(document):
    table = document.tables[2]
    for col in range(2, 8):
        set_cell(table.cell(1, col), f"S{col - 1}", size=9, bold=True, color=DARK,
                 align=WD_ALIGN_PARAGRAPH.CENTER)
        shade(table.cell(1, col), "F1F5F9")

    activities = [
        ("Revisar el caso y anotar lo que necesita la botica", [2]),
        ("Diseñar la base de datos y la API", [2, 3]),
        ("Programar el backend con Node.js", [3, 4]),
        ("Programar el frontend con React", [4, 5]),
        ("Unir la venta FEFO, inventario y reportes", [5, 6]),
        ("Probar, documentar y presentar", [6, 7]),
    ]
    for row_index, (activity, weeks) in enumerate(activities, start=2):
        set_cell(table.cell(row_index, 0), str(row_index - 1), size=9, bold=True,
                 color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell(table.cell(row_index, 1), activity, size=9, color=SLATE)
        for week in weeks:
            set_cell(table.cell(row_index, week), "X", size=10, bold=True,
                     color=RED, align=WD_ALIGN_PARAGRAPH.CENTER)
            shade(table.cell(row_index, week), "FDE2E4")
    mark_header_row(table, 0)
    mark_header_row(table, 1)


def fill_resources(document):
    machines = document.tables[3]
    machine_items = [
        ("Laptop o computadora", "1"),
        ("Servidor local con XAMPP y MySQL", "1"),
        ("Internet y red local", "1"),
        ("Celular para probar el diseño", "1"),
    ]
    for row_index, (description, quantity) in enumerate(machine_items, start=2):
        set_cell(machines.cell(row_index, 0), description, size=9.3, color=SLATE)
        set_cell(machines.cell(row_index, 1), quantity, size=9.3, bold=True,
                 color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER)

    tools = document.tables[4]
    tool_items = [
        ("Visual Studio Code", "1"),
        ("Node.js y npm", "1"),
        ("Git y GitHub", "1"),
        ("Navegador con herramientas de desarrollo", "1"),
    ]
    for row_index, (description, quantity) in enumerate(tool_items, start=2):
        set_cell(tools.cell(row_index, 0), description, size=9.3, color=SLATE)
        set_cell(tools.cell(row_index, 1), quantity, size=9.3, bold=True,
                 color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER)

    materials = document.tables[5]
    material_items = [
        ("MySQL / MariaDB", "1"),
        ("Archivos CSV y PDF de prueba", "1"),
        ("Formato del trabajo final", "1"),
        ("Usuarios y datos de prueba", "1"),
    ]
    for row_index, (description, quantity) in enumerate(material_items, start=2):
        set_cell(materials.cell(row_index, 0), description, size=9.3, color=SLATE)
        set_cell(materials.cell(row_index, 1), quantity, size=9.3, bold=True,
                 color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER)


def fill_proposal(document):
    table = document.tables[6]
    cell = table.cell(1, 0)
    clear_cell(cell)

    add_para(cell, "1. Resumen", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "Nova Salud es una botica que vende medicamentos y productos de farmacia. El control manual ya "
        "no alcanza: el stock no siempre coincide, algunos productos se acaban, otros se vencen y la "
        "atención es lenta. La propuesta es un sistema web que ordena el catálogo, los lotes, el stock, "
        "las ventas y los reportes.",
    )

    add_para(cell, "2. Problema", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "Hoy la información está en cuadernos y hojas de cálculo. No hay avisos de stock bajo ni de "
        "vencimientos. Tampoco se sabe qué lote se vendió. Esto causa faltantes, pérdidas y demoras.",
    )

    add_para(cell, "3. Solución", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "Se hizo un sistema con tres partes: React para la pantalla, Node.js/Express para el servidor "
        "y MySQL para la base de datos. El sistema tiene login, panel, medicamentos, lotes, "
        "vencimientos, inventario, punto de venta, historial, reportes y usuarios.",
    )

    add_para(cell, "4. Arquitectura", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "La pantalla se comunica con la API por Internet. La API revisa el login y guarda todo en "
        "MySQL. En producción, el mismo servidor entrega la pantalla compilada y la API.",
    )
    add_image(
        cell,
        "arquitectura_novasalud.png",
        5.5,
        "Figura 1. Arquitectura del sistema: React, API Node.js y MySQL.",
    )

    add_para(cell, "5. Módulos", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    modules = [
        "Login con roles de administrador y vendedor.",
        "Panel con stock, ventas, vencimientos y avisos.",
        "Medicamentos con precio, stock mínimo y foto.",
        "Lotes con fecha de vencimiento y cantidad.",
        "Inventario con entradas, salidas y ajustes.",
        "Punto de venta con carrito y validación de stock.",
        "Historial, comprobante y reportes CSV/PDF.",
        "Usuarios y configuración de avisos.",
    ]
    for module in modules:
        add_para(cell, module, size=9.4, bullet=True, space_after=1)

    add_para(cell, "6. Venta FEFO", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "FEFO significa “primero vence, primero sale”. Cuando se confirma una venta, el sistema busca "
        "los lotes disponibles, ordena por fecha de vencimiento y descuenta primero el que vence antes. "
        "Si no hay stock suficiente, no guarda la venta. Así se evita vender productos vencidos y se "
        "pierde menos mercadería.",
    )

    page_break = cell.add_paragraph()
    page_break.add_run().add_break(WD_BREAK.PAGE)
    add_para(cell, "7. Tecnologías", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    technologies = [
        "Frontend: React, Vite, Bootstrap, React Router, Formik, Yup y Chart.js.",
        "Backend: Node.js, Express, mysql2, JWT, bcrypt, multer y pdfkit.",
        "Base de datos: MySQL / MariaDB (bd_botica).",
        "Herramientas: Git, GitHub, Visual Studio Code y navegador.",
    ]
    for item in technologies:
        add_para(cell, item, size=9.4, bullet=True, space_after=1)

    add_para(cell, "8. Seguridad y normas", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "El sistema usa JWT para la sesión, bcrypt para las claves, roles para los permisos y consultas "
        "preparadas para evitar inyección SQL. También valida los datos y limita los intentos de login. "
        "Se tomaron como referencia ISO/IEC 25010, OWASP Top 10, ISO 9001, ISO 14001, ISO 45001, la Ley "
        "29783 y la Ley 29733.",
    )

    add_para(cell, "9. Beneficios y viabilidad", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    benefits = [
        "Menos faltantes y menos pérdidas por vencimiento.",
        "Inventario más exacto y con historial por lote.",
        "Atención más rápida y con menos errores.",
        "Reportes para comprar mejor y tomar decisiones.",
        "Más seguridad y control de accesos.",
        "El sistema puede crecer a facturación o varias tiendas.",
    ]
    for benefit in benefits:
        add_para(cell, benefit, size=9.4, bullet=True, space_after=1)
    add_para(
        cell,
        "Es viable porque usa herramientas gratuitas, la botica ya tiene la base de datos y el diseño, "
        "y la pantalla es fácil de usar. Solo se necesita una computadora, internet y capacitación corta.",
    )

    add_para(cell, "10. Evidencias", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "Se probó la API con 17 pruebas y todas pasaron. También se probó el login con administrador y "
        "vendedor, una venta real con descuento de lote, el comprobante y los reportes CSV/PDF. La "
        "Figura 2, en la tabla de evidencias, muestra el panel del sistema en funcionamiento.",
    )


def fill_operations(document):
    table = document.tables[7]
    operations = [
        (
            "Revisar el caso y anotar las necesidades de la botica.",
            "ISO/IEC 25010; hablar con el personal; anotar todo.",
        ),
        (
            "Diseñar la base de datos y las tablas.",
            "Datos ordenados; integridad; copia de seguridad.",
        ),
        (
            "Preparar el servidor con Node.js y Express.",
            "Claves fuera del código; control de versiones.",
        ),
        (
            "Crear el login y los roles.",
            "OWASP; claves seguras; permisos por rol.",
        ),
        (
            "Crear medicamentos, lotes, usuarios y configuración.",
            "Validar datos; controlar imágenes; permisos.",
        ),
        (
            "Programar la venta FEFO.",
            "Transacción; no vender lotes vencidos; no dejar stock negativo.",
        ),
        (
            "Crear avisos, reportes y comprobantes.",
            "ISO 9001; datos confiables; protección de datos.",
        ),
        (
            "Probar el sistema.",
            "ISO/IEC 25010; probar login, ventas, reportes y roles.",
        ),
        (
            "Publicar y capacitar al personal.",
            "Respaldos; HTTPS; pausas activas; reciclaje de equipos.",
        ),
    ]

    for row_index, (operation, norm) in enumerate(operations, start=1):
        set_cell(table.cell(row_index, 0), operation, size=9.1, color=SLATE)
        set_cell(table.cell(row_index, 1), norm, size=9.1, color=SLATE)

    # Eliminar las filas sobrantes para que la tabla no quede con espacios vacíos.
    for row_index in range(len(table.rows) - 1, len(operations), -1):
        table._tbl.remove(table.rows[row_index]._tr)

    mark_header_row(table, 0)


def fill_evidence(document):
    table = document.tables[8]
    row = table.rows[0]
    merged = row.cells[0]
    clear_cell(merged)
    add_image(
        merged,
        "evidencia_dashboard.jpeg",
        5.55,
        "Figura 2. Panel de Nova Salud con stock, ventas y vencimientos.",
    )
    merged.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    set_cell(table.cell(1, 1), TOPIC, size=9.5, bold=True, color=DARK,
             align=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell(table.cell(2, 1), STUDENT, size=9.5, color=DARK,
             align=WD_ALIGN_PARAGRAPH.CENTER)
    set_cell(table.cell(2, 2), "1:1", size=9.5, bold=True, color=DARK,
             align=WD_ALIGN_PARAGRAPH.CENTER)


def fill_checklist(document):
    table = document.tables[9]
    for row_index in range(1, len(table.rows)):
        row = table.rows[row_index]
        checkboxes = row._tr.findall(qn("w:sdt"))
        if len(checkboxes) >= 2:
            set_checkbox(checkboxes[0], True)
            set_checkbox(checkboxes[1], False)
    mark_header_row(table, 0)


def fill_scores(document):
    table = document.tables[10]
    scores = {1: "3", 2: "8", 3: "6", 4: "3", 5: "20"}
    for row_index, score in scores.items():
        set_cell(table.cell(row_index, 3), score, size=10, bold=True, color=DARK,
                 align=WD_ALIGN_PARAGRAPH.CENTER)
    mark_header_row(table, 0)

    # La sección 6 debe empezar en una página nueva junto con su tabla.
    for paragraph in document.paragraphs:
        if "6. VALORAR" in "".join(paragraph._p.itertext()):
            paragraph.paragraph_format.page_break_before = True
            break


def main():
    document = Document(SOURCE)
    document.core_properties.title = "Trabajo Final - Sistema web Nova Salud"
    document.core_properties.subject = "Fullstack Developer Software"
    document.core_properties.author = STUDENT
    document.core_properties.last_modified_by = STUDENT
    document.core_properties.comments = (
        "Formato oficial completado con la propuesta de migración de Nova Salud a React + Node.js + MySQL."
    )

    remove_cant_split(document)
    fill_student_data(document)
    fill_paragraphs(document)
    fill_questions(document)
    fill_schedule(document)
    fill_resources(document)
    fill_proposal(document)
    fill_operations(document)
    fill_evidence(document)
    fill_checklist(document)
    fill_scores(document)
    remove_placeholder_shapes(document)

    OUTPUT.parent.mkdir(exist_ok=True)
    document.save(OUTPUT)
    print(f"Documento generado: {OUTPUT}")


if __name__ == "__main__":
    main()
