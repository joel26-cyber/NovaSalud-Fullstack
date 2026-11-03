"""Completa el formato oficial del trabajo final con la propuesta Nova Salud.

Uso:
    py docs/llenar_formato.py

Genera:
    docs/FORMATO_TRABAJO_FINAL_LLENADO.docx
"""

from pathlib import Path

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH
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


def mark_header_row(table, row_index):
    tr_pr = table.rows[row_index]._tr.get_or_add_trPr()
    if tr_pr.find(qn("w:tblHeader")) is None:
        tr_pr.append(OxmlElement("w:tblHeader"))


def add_check_cells(row, marks):
    for mark in marks:
        tc = OxmlElement("w:tc")
        tc_pr = OxmlElement("w:tcPr")
        width = OxmlElement("w:tcW")
        width.set(qn("w:w"), "900")
        width.set(qn("w:type"), "dxa")
        tc_pr.append(width)
        tc.append(tc_pr)
        paragraph = OxmlElement("w:p")
        p_pr = OxmlElement("w:pPr")
        jc = OxmlElement("w:jc")
        jc.set(qn("w:val"), "center")
        p_pr.append(jc)
        paragraph.append(p_pr)
        run = OxmlElement("w:r")
        r_pr = OxmlElement("w:rPr")
        r_pr.append(OxmlElement("w:b"))
        color = OxmlElement("w:color")
        color.set(qn("w:val"), "0F9F6E" if mark else "64748B")
        r_pr.append(color)
        run.append(r_pr)
        text = OxmlElement("w:t")
        text.text = mark
        run.append(text)
        paragraph.append(run)
        tc.append(paragraph)
        row._tr.append(tc)


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
            "La botica Nova Salud ha crecido en clientes y volumen de operaciones, pero su control de "
            "inventario y ventas aún depende de registros manuales. Esta situación genera diferencias "
            "entre el stock físico y el registrado, desabastecimientos de productos de alta rotación, "
            "pérdidas por medicamentos vencidos, demoras en la atención y poca trazabilidad sobre los "
            "lotes entregados. El problema central es la ausencia de un sistema web integrado que "
            "centralice el catálogo, los lotes, las existencias, las ventas y las alertas en tiempo real.",
            "El caso se aborda desde el desarrollo fullstack: se migra la aplicación PHP existente a una "
            "arquitectura desacoplada con una SPA en React, una API REST en Node.js/Express y MySQL. La "
            "propuesta conserva la identidad visual de Nova Salud, incorpora autenticación JWT con roles, "
            "automatiza la venta FEFO y genera reportes CSV/PDF.",
        ],
    )

    solution_anchor = find("Identifica propuesta de solución y evidencias.")
    insert_paras_after(
        solution_anchor,
        [
            "La propuesta de solución es un sistema web fullstack denominado Nova Salud, compuesto por un "
            "frontend React + Vite, un backend Express + MySQL y la base de datos relacional bd_botica. "
            "El sistema cubre el ciclo completo: autenticación, dashboard, catálogo de medicamentos, "
            "registro de lotes, control de vencimientos, inventario, punto de venta con FEFO, historial, "
            "comprobantes, reportes y administración de usuarios.",
            "Las evidencias de implementación son: API REST probada, SPA responsive con Bootstrap, scripts "
            "de instalación de base de datos, pruebas smoke 17/17, pruebas de interfaz con los roles "
            "administrador y vendedor, venta real registrada con descuento por lote, comprobante interno y "
            "reportes CSV/PDF. El detalle técnico se amplía en la propuesta de solución y en las tablas de "
            "operaciones y normas.",
        ],
    )

    questions_anchor = find("Durante el análisis y estudio del caso práctico")
    insert_paras_after(
        questions_anchor,
        [
            "Las respuestas se presentan a continuación, vinculando el caso Nova Salud con las preguntas "
            "guía del trabajo final y con las decisiones de diseño de la solución.",
        ],
    )

    schedule_anchor = find("Cronograma de actividades:")
    insert_paras_after(
        schedule_anchor,
        [
            "S1 a S6 corresponden a las seis semanas de ejecución del trabajo final. Cada actividad se "
            "marca con X en la semana en que se desarrolla.",
        ],
    )

    resources_anchor = find("Lista de recursos necesarios:")
    insert_paras_after(
        resources_anchor,
        [
            "Todos los recursos son de uso libre o ya se encuentran disponibles en el entorno de "
            "desarrollo; no se requiere inversión adicional en licencias.",
        ],
    )

    operations_anchor = find("INSTRUCCIONES: Ser lo más explícito posible.")
    insert_paras_after(
        operations_anchor,
        [
            "Las operaciones se ejecutaron siguiendo el ciclo de vida del software y se vincularon con "
            "normas de calidad, seguridad de la información, seguridad y salud en el trabajo y cuidado "
            "ambiental.",
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
            ("Los principales desafíos operativos son:", True),
            ("Registro manual y disperso: las existencias se anotan en cuadernos u hojas de cálculo, lo que produce diferencias entre el stock físico y el registrado.", False),
            ("Desabastecimiento y sobrestock: sin alertas de stock mínimo ni visibilidad de rotación, se compra tarde o en exceso.", False),
            ("Pérdida por vencimientos: no se aplica FEFO y los lotes próximos a vencer no se identifican a tiempo.", False),
            ("Falta de trazabilidad: no se sabe con precisión qué lote se entregó en cada venta, lo que dificulta auditorías y reclamos.", False),
            ("Demoras en la atención: la búsqueda de precios, stock y lotes es lenta y propensa a errores.", False),
            ("Información poco confiable para decidir: no existen reportes oportunos de ventas, margen, rotación ni productos críticos.", False),
            ("Riesgos de seguridad: accesos compartidos, claves débiles y ausencia de roles diferenciados.", False),
            ("Dependencia de las personas: el conocimiento queda en el personal y no en un sistema.", False),
            ("En Nova Salud el crecimiento de clientes agrava estos problemas y afecta la continuidad del negocio.", False),
        ],
        [
            ("El software debe incluir:", True),
            ("Autenticación segura con JWT, contraseñas cifradas con bcrypt y roles administrador/vendedor.", False),
            ("Dashboard con stock disponible, ventas del día, ingresos, productos próximos a vencer, lotes vencidos y alertas de stock bajo.", False),
            ("Catálogo de medicamentos con código, nombre, categoría, concentración, presentación, laboratorio, precio, stock mínimo e imagen.", False),
            ("Gestión de lotes con número, fecha de ingreso, fecha de vencimiento, cantidad inicial, cantidad disponible y estado (habilitado/bloqueado).", False),
            ("Control de vencimientos configurable (días de anticipación) y clasificación automática: vencido, próximo y vigente.", False),
            ("Inventario con movimientos auditables y ajustes de entrada/salida justificados.", False),
            ("Punto de venta ágil: búsqueda, carrito, validación de stock en tiempo real, selección FEFO y confirmación transaccional.", False),
            ("Historial de ventas, comprobante interno y detalle de lotes utilizados.", False),
            ("Reportes CSV/PDF de ventas y stock.", False),
            ("Administración de usuarios y configuración de alertas.", False),
            ("Interfaz responsive, intuitiva y consistente con la identidad visual de Nova Salud.", False),
            ("API REST documentada, validaciones en servidor y manejo controlado de errores.", False),
            ("Estas características cubren los requisitos del caso y las condiciones de seguridad, alertas y usabilidad.", False),
        ],
        [
            ("El impacto se produce por cuatro mecanismos:", True),
            ("Visibilidad en tiempo real: el stock se calcula desde los lotes y se actualiza con cada venta o ajuste, reduciendo diferencias.", False),
            ("Alertas proactivas: el dashboard y el módulo de vencimientos avisan cuando un producto está por agotarse o un lote está próximo a vencer, permitiendo reponer o rotar a tiempo.", False),
            ("FEFO automático: el sistema descuenta primero el lote que vence antes, disminuyendo pérdidas por vencimiento y liberando espacio.", False),
            ("Venta rápida y segura: la búsqueda, el carrito y la validación de stock reducen el tiempo de atención y evitan vender productos agotados.", False),
            ("Con ello se espera reducir el desabastecimiento, disminuir quejas por falta de productos, mejorar la exactitud del inventario y aumentar la confianza del cliente.", False),
            ("La transacción FEFO garantiza que una venta no deje el stock en negativo ni registre lotes vencidos. El impacto puede medirse con indicadores antes/después y revisarse semanalmente.", False),
        ],
        [
            ("Beneficios adicionales:", True),
            ("Analítica comercial: reportes de ventas por período, productos más vendidos, ingresos y comportamiento del stock.", False),
            ("Mejor planificación de compras: identificación de rotación y productos críticos.", False),
            ("Reducción de papel y costos operativos: comprobantes digitales y reportes exportables.", False),
            ("Auditoría y cumplimiento: trazabilidad de quién vendió, qué lote entregó y cuándo.", False),
            ("Seguridad y control: roles, registros de acceso y menor dependencia de claves compartidas.", False),
            ("Escalabilidad: la arquitectura SPA + API permite agregar e-commerce, facturación electrónica, proveedores o multi-sucursal.", False),
            ("Imagen y competitividad: atención más rápida, información confiable y servicio moderno.", False),
            ("Toma de decisiones: datos para negociar con proveedores y ajustar precios.", False),
            ("Sostenibilidad: menos impresiones y mejor control de vencimientos, lo que reduce desperdicios.", False),
            ("Capacitación: interfaz intuitiva que facilita la incorporación de nuevo personal.", False),
        ],
        [
            ("Métricas propuestas:", True),
            ("Tasa de desabastecimiento = productos agotados / productos activos × 100; meta < 5%.", False),
            ("Exactitud de inventario = registros coincidentes / registros auditados × 100; meta > 98%.", False),
            ("Pérdida por vencimiento = unidades vencidas / unidades ingresadas × 100; meta < 2%.", False),
            ("Tiempo promedio de venta = suma de tiempos de atención / número de ventas; meta < 60 s.", False),
            ("Errores por venta = ventas con corrección / total de ventas; meta < 1%.", False),
            ("Rotación de inventario = costo de ventas / inventario promedio; revisión mensual.", False),
            ("Cumplimiento FEFO = ventas que usan el lote más próximo / ventas con lote; meta 100%.", False),
            ("Disponibilidad del sistema = tiempo operativo / tiempo total; meta > 99%.", False),
            ("Latencia de API = percentil 95 del tiempo de respuesta; meta < 500 ms.", False),
            ("Satisfacción del cliente = encuesta CSAT/NPS; meta > 85%.", False),
            ("Adopción = usuarios activos / usuarios registrados; meta > 90%.", False),
            ("Uso de reportes = reportes generados por mes.", False),
            ("Se recomienda establecer una línea base antes de la implementación y comparar a los 30, 60 y 90 días.", False),
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
        ("Análisis del caso, levantamiento de requisitos y definición del alcance", [2]),
        ("Diseño de arquitectura, modelo de datos y contratos de API", [2, 3]),
        ("Desarrollo del backend Node.js/Express, JWT y MySQL", [3, 4]),
        ("Desarrollo del frontend React/Vite, Bootstrap, rutas y formularios", [4, 5]),
        ("Integración FEFO, inventario, reportes y comprobantes", [5, 6]),
        ("Pruebas, documentación, despliegue y presentación", [6, 7]),
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
        ("Laptop o computadora de desarrollo (Windows 11, 16 GB RAM, SSD)", "1"),
        ("Servidor local de pruebas (XAMPP / MySQL)", "1"),
        ("Red local y conexión a internet", "1"),
        ("Dispositivo móvil para pruebas responsive", "1"),
    ]
    for row_index, (description, quantity) in enumerate(machine_items, start=2):
        set_cell(machines.cell(row_index, 0), description, size=9.3, color=SLATE)
        set_cell(machines.cell(row_index, 1), quantity, size=9.3, bold=True,
                 color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER)

    tools = document.tables[4]
    tool_items = [
        ("Visual Studio Code", "1"),
        ("Node.js 24 LTS y npm", "1"),
        ("Git y GitHub", "1"),
        ("Navegador Chromium con DevTools", "1"),
    ]
    for row_index, (description, quantity) in enumerate(tool_items, start=2):
        set_cell(tools.cell(row_index, 0), description, size=9.3, color=SLATE)
        set_cell(tools.cell(row_index, 1), quantity, size=9.3, bold=True,
                 color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER)

    materials = document.tables[5]
    material_items = [
        ("MySQL / MariaDB (base de datos bd_botica)", "1"),
        ("Archivos CSV y PDF de prueba", "1"),
        ("Documentación del caso y formato de informe", "1"),
        ("Credenciales y datos de demostración", "1"),
    ]
    for row_index, (description, quantity) in enumerate(material_items, start=2):
        set_cell(materials.cell(row_index, 0), description, size=9.3, color=SLATE)
        set_cell(materials.cell(row_index, 1), quantity, size=9.3, bold=True,
                 color=DARK, align=WD_ALIGN_PARAGRAPH.CENTER)


def fill_proposal(document):
    table = document.tables[6]
    cell = table.cell(1, 0)
    clear_cell(cell)

    add_para(cell, "1. Resumen ejecutivo", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "Nova Salud es una botica con alta demanda de medicamentos y productos farmacéuticos. "
        "El crecimiento de clientes hizo evidente que el control manual del inventario ya no es "
        "suficiente: genera diferencias de stock, desabastecimientos, pérdidas por vencimiento y "
        "demoras en la atención. La propuesta consiste en un sistema web fullstack que centraliza "
        "el catálogo, los lotes, las existencias, las ventas, los comprobantes y los reportes, con "
        "alertas automáticas y trazabilidad FEFO.",
    )

    add_para(cell, "2. Situación problemática", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "El registro manual obliga a consultar varias fuentes para conocer el stock real. No existe "
        "una regla automática que indique cuándo reponer un producto ni qué lote debe salir primero. "
        "Tampoco hay seguridad por roles ni un historial confiable de movimientos. El resultado es un "
        "riesgo operativo y económico: se vende lo que no hay, se vence mercadería y el cliente espera "
        "más de lo necesario.",
    )

    add_para(cell, "3. Solución propuesta", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "Se implementó una arquitectura desacoplada: una SPA en React + Vite para la interfaz, una API "
        "REST en Node.js + Express para las reglas de negocio y MySQL para la persistencia. La API "
        "autentica con JWT, valida permisos por rol y expone endpoints para dashboard, medicamentos, "
        "lotes, vencimientos, inventario, ventas, reportes y usuarios. El frontend consume la API con "
        "Axios y conserva el diseño Bootstrap de Nova Salud.",
    )

    add_para(cell, "4. Arquitectura de la solución", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_image(
        cell,
        "arquitectura_novasalud.png",
        6.0,
        "Figura 1. Arquitectura SPA + API REST + MySQL de Nova Salud.",
    )

    add_para(cell, "5. Módulos implementados", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    modules = [
        "Autenticación y autorización: login con JWT, contraseñas bcrypt y roles administrador/vendedor.",
        "Dashboard: stock disponible, ventas del día, ingresos, productos próximos a vencer, lotes vencidos y stock bajo.",
        "Medicamentos: CRUD, categorías, precio, stock mínimo e imagen.",
        "Lotes: número, ingreso, vencimiento, cantidad inicial/disponible y bloqueo.",
        "Vencimientos: clasificación automática y alerta configurable de días.",
        "Inventario: movimientos auditables y ajustes de entrada/salida con motivo.",
        "Punto de venta: búsqueda, carrito, validación de stock y venta FEFO transaccional.",
        "Historial y comprobantes: consulta de ventas y detalle de lotes utilizados.",
        "Reportes: ventas diarias, productos más vendidos y exportación CSV/PDF.",
        "Usuarios y ajustes: creación de cuentas y configuración de alertas.",
    ]
    for module in modules:
        add_para(cell, module, size=9.4, bullet=True, space_after=1)

    add_para(cell, "6. Lógica FEFO", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "FEFO significa First Expired, First Out: primero vence, primero sale. Al confirmar una venta, "
        "el backend abre una transacción, bloquea los lotes vigentes con FOR UPDATE, verifica el stock, "
        "ordena los lotes por fecha de vencimiento y descuenta primero el más próximo a vencer. Si el "
        "stock es insuficiente, revierte toda la operación. Si la venta es válida, registra la cabecera, "
        "el detalle, los lotes utilizados y los movimientos de inventario, y confirma con COMMIT.",
    )
    add_image(
        cell,
        "flujo_fefo.png",
        3.7,
        "Figura 2. Flujo transaccional FEFO implementado en ventaService.js.",
    )

    add_para(cell, "7. Tecnologías utilizadas", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    technologies = [
        "Frontend: React 19, Vite, React Router, Bootstrap 5, Bootstrap Icons, Formik, Yup, Axios y Chart.js.",
        "Backend: Node.js 24, Express 5, mysql2, jsonwebtoken, bcryptjs, multer, pdfkit, helmet y cors.",
        "Base de datos: MySQL / MariaDB, base bd_botica con integridad referencial e índices.",
        "Herramientas: Git, GitHub, Visual Studio Code, npm y navegador Chromium con DevTools.",
    ]
    for item in technologies:
        add_para(cell, item, size=9.4, bullet=True, space_after=1)

    add_para(cell, "8. Seguridad, calidad y normas", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "La seguridad se apoya en JWT con expiración, bcrypt para contraseñas, autorización por rol, "
        "consultas preparadas, validación de entradas, CORS restringido, cabeceras de seguridad con "
        "Helmet, limitación de intentos de login y validación de archivos subidos. La calidad se "
        "gestiona con pruebas smoke, pruebas de interfaz, revisión de consola y documentación. Se "
        "toman como referencia ISO/IEC 25010, OWASP Top 10, ISO 9001, ISO 14001, ISO 45001, la Ley "
        "29783 de seguridad y salud en el trabajo y la Ley 29733 de protección de datos personales.",
    )

    add_para(cell, "9. Despliegue y operación", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "El frontend se compila con Vite y Express sirve la carpeta dist, de modo que la aplicación "
        "puede ejecutarse en un solo servidor. La configuración sensible se mantiene en variables de "
        "entorno. En producción se recomienda HTTPS, respaldos programados de MySQL, monitoreo de logs "
        "y un plan de recuperación. El entorno local se levanta con MySQL, npm run db:setup, npm start "
        "en backend y npm run dev en frontend.",
    )

    add_para(cell, "10. Beneficios esperados", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    benefits = [
        "Reducción del desabastecimiento y de las pérdidas por vencimiento.",
        "Mayor exactitud del inventario y trazabilidad completa por lote.",
        "Atención más rápida y menor cantidad de errores en caja.",
        "Información oportuna para compras, precios y toma de decisiones.",
        "Control de accesos, auditoría y respaldo de la información.",
        "Base escalable para facturación electrónica, e-commerce o multi-sucursal.",
    ]
    for benefit in benefits:
        add_para(cell, benefit, size=9.4, bullet=True, space_after=1)

    add_para(cell, "11. Viabilidad", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "La propuesta es técnicamente viable porque utiliza tecnologías gratuitas y ampliamente "
        "documentadas, y porque el equipo ya cuenta con la base de datos y el diseño original. Es "
        "económicamente viable por el bajo costo de licencias y la reducción esperada de pérdidas. Es "
        "operativamente viable porque la interfaz conserva la lógica de la botica y requiere capacitación "
        "corta. Es legalmente viable si se aplican políticas de privacidad, control de accesos y respaldo.",
    )

    add_para(cell, "12. Evidencias de ejecución", size=10.5, bold=True, color=DARK, heading=True,
             align=WD_ALIGN_PARAGRAPH.LEFT)
    add_para(
        cell,
        "Se ejecutaron 17 pruebas smoke sin fallos, pruebas de interfaz con administrador y vendedor, "
        "validación de la venta FEFO con descuento real de lote, generación de comprobante interno, "
        "exportación CSV/PDF y compilación de producción servida por Express. La Figura 3 presenta el "
        "dashboard en operación y la Figura 4 el módulo de usuarios y configuración.",
    )


def fill_operations(document):
    table = document.tables[7]
    operations = [
        (
            "Análisis del caso y levantamiento de requerimientos: identificar actores, procesos, reglas de negocio y requisitos funcionales y no funcionales.",
            "ISO/IEC 25010 (adecuación funcional y usabilidad); documentación trazable; participación del personal de la botica.",
        ),
        (
            "Diseño de la base de datos bd_botica: entidades, relaciones, claves, índices y normalización.",
            "Integridad referencial; tercera forma normal (3FN); respaldo previo de la información; protección de datos.",
        ),
        (
            "Configuración del entorno backend: Node.js, Express, mysql2, variables de entorno y scripts npm.",
            "Principio de menor privilegio; secretos fuera del código fuente; control de versiones con Git.",
        ),
        (
            "Implementación de autenticación y autorización: JWT, bcrypt, roles administrador y vendedor.",
            "OWASP A01, A02 y A07; contraseñas robustas; expiración de sesión; HTTPS en producción.",
        ),
        (
            "CRUD de medicamentos, lotes, usuarios y configuración: validación de datos y carga de imágenes.",
            "Validación en servidor; límite de tamaño y tipo de archivo; control de acceso; consentimiento de imágenes.",
        ),
        (
            "Registro de ventas FEFO: transacción, bloqueo FOR UPDATE, descuento por lote y movimientos de inventario.",
            "Propiedades ACID; trazabilidad por lote; prevención de stock negativo; integridad de precios históricos.",
        ),
        (
            "Alertas de stock bajo y vencimientos: cálculo con fechas del servidor y configuración de días de anticipación.",
            "ISO 9001 (mejora continua); buenas prácticas de almacenamiento; revisión periódica de lotes.",
        ),
        (
            "Reportes CSV/PDF y comprobantes: generación, descarga e impresión.",
            "Integridad de la información; formatos abiertos; protección de datos personales; accesibilidad.",
        ),
        (
            "Pruebas: smoke 17/17, pruebas de interfaz, roles, FEFO y regresión de stock.",
            "ISO/IEC 25010 (fiabilidad y seguridad); pruebas documentadas; corrección y prevención de defectos.",
        ),
        (
            "Despliegue: build de React, servicio estático desde Express, MySQL y respaldos.",
            "Copias de seguridad; monitoreo; recuperación ante desastres; gestión de cambios.",
        ),
        (
            "Capacitación y uso: roles, buenas prácticas de atención, pausas activas y ergonomía.",
            "ISO 45001 y Ley 29783; ergonomía; privacidad; confidencialidad de la información.",
        ),
        (
            "Operación y mantenimiento: actualizaciones, revisión de logs, consumo energético y RAEE.",
            "ISO 14001; eficiencia energética; reciclaje de equipos; apagado responsable de equipos.",
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
        "Figura 3. Dashboard de Nova Salud con indicadores de stock, ventas y vencimientos.",
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
        # El formato original deja una sola celda en el cuerpo; se agregan
        # las columnas CUMPLE y NO CUMPLE para poder marcar la evidencia.
        add_check_cells(row, ["X", ""])
    mark_header_row(table, 0)


def fill_scores(document):
    table = document.tables[10]
    scores = {1: "3", 2: "8", 3: "6", 4: "3", 5: "20"}
    for row_index, score in scores.items():
        set_cell(table.cell(row_index, 3), score, size=10, bold=True, color=DARK,
                 align=WD_ALIGN_PARAGRAPH.CENTER)
    mark_header_row(table, 0)


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

    OUTPUT.parent.mkdir(exist_ok=True)
    document.save(OUTPUT)
    print(f"Documento generado: {OUTPUT}")


if __name__ == "__main__":
    main()
