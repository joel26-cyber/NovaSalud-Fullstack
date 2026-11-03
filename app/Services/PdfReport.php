<?php
declare(strict_types=1);

namespace App\Services;

final class PdfReport
{
    private const PAGE_WIDTH = 595.28;
    private const PAGE_HEIGHT = 841.89;
    private const MARGIN = 42.0;

    private array $pages = [];

    public function __construct(
        private readonly string $title,
        private readonly string $subtitle,
        private readonly array $headers,
        private readonly array $widths,
        private readonly array $alignments = [],
        private readonly ?string $logoPath = null
    ) {
        if (count($headers) !== count($widths)) {
            throw new \InvalidArgumentException('Las columnas del PDF no coinciden.');
        }
    }

    public function render(array $rows, string $summary): string
    {
        $page = $this->newPage($summary);
        $y = 158.0;
        $this->drawTableHeader($page, $y);
        $y += 27.0;

        if ($rows === []) {
            $this->text($page, self::MARGIN + 10, $y + 10, 'No hay datos para mostrar.', 10, false, [0.39, 0.45, 0.55]);
        }

        foreach ($rows as $index => $row) {
            if ($y + 25 > 790) {
                $page = $this->newPage($summary);
                $y = 158.0;
                $this->drawTableHeader($page, $y);
                $y += 27.0;
            }

            $this->drawRow($page, $y, array_values($row), $index % 2 === 1);
            $y += 25.0;
        }

        $totalPages = count($this->pages);
        foreach (array_keys($this->pages) as $pageIndex) {
            $this->line($pageIndex, self::MARGIN, 806, self::PAGE_WIDTH - self::MARGIN, 806, [0.88, 0.90, 0.93]);
            $this->text($pageIndex, self::MARGIN, 816, 'Generado por Sistema Nova Salud', 8, false, [0.45, 0.49, 0.56]);
            $footer = 'Página '.($pageIndex + 1).' de '.$totalPages;
            $this->textRight($pageIndex, self::PAGE_WIDTH - self::MARGIN, 816, $footer, 8, false, [0.45, 0.49, 0.56]);
        }

        return $this->buildPdf();
    }

    private function newPage(string $summary): int
    {
        $this->pages[] = [];
        $page = count($this->pages) - 1;

        $this->rect($page, 0, 0, self::PAGE_WIDTH, 8, [0.91, 0.08, 0.18]);
        $this->rect($page, self::MARGIN, 20, self::PAGE_WIDTH - (self::MARGIN * 2), 48, [0.03, 0.05, 0.09]);
        if ($this->hasLogo()) {
            $this->image($page, (self::PAGE_WIDTH - 145) / 2, 25, 145, 40.3);
        } else {
            $this->text($page, self::MARGIN + 12, 35, 'NOVA SALUD', 17, true, [1, 1, 1]);
        }
        $this->text($page, self::MARGIN, 82, $this->title, 20, true, [0.06, 0.10, 0.18]);
        $this->text($page, self::MARGIN, 109, $this->subtitle, 10, false, [0.38, 0.44, 0.53]);
        $this->rect($page, self::MARGIN, 127, self::PAGE_WIDTH - (self::MARGIN * 2), 22, [0.98, 0.93, 0.94]);
        $this->text($page, self::MARGIN + 9, 133, $summary, 9, true, [0.72, 0.07, 0.15]);

        return $page;
    }

    private function drawTableHeader(int $page, float $y): void
    {
        $x = self::MARGIN;
        $this->rect($page, $x, $y, array_sum($this->widths), 27, [0.08, 0.12, 0.20]);
        foreach ($this->headers as $index => $header) {
            $this->cellText($page, $x, $y + 7, (float) $this->widths[$index], (string) $header, 8.5, true, 'left', [1, 1, 1]);
            $x += (float) $this->widths[$index];
        }
    }

    private function drawRow(int $page, float $y, array $row, bool $alternate): void
    {
        $x = self::MARGIN;
        $fill = $alternate ? [0.97, 0.98, 0.99] : [1, 1, 1];
        $this->rect($page, $x, $y, array_sum($this->widths), 25, $fill);
        $this->line($page, $x, $y + 25, $x + array_sum($this->widths), $y + 25, [0.90, 0.92, 0.95]);

        foreach ($this->widths as $index => $width) {
            $value = isset($row[$index]) ? (string) $row[$index] : '';
            $alignment = $this->alignments[$index] ?? 'left';
            $this->cellText($page, $x, $y + 7, (float) $width, $value, 8.5, false, $alignment, [0.12, 0.16, 0.23]);
            $x += (float) $width;
        }
    }

    private function cellText(int $page, float $x, float $y, float $width, string $value, float $size, bool $bold, string $alignment, array $color): void
    {
        $value = $this->truncate($value, $width - 12, $size);
        if ($alignment === 'right') {
            $this->textRight($page, $x + $width - 6, $y, $value, $size, $bold, $color);
            return;
        }
        if ($alignment === 'center') {
            $textWidth = $this->estimateWidth($value, $size);
            $this->text($page, $x + max(6, ($width - $textWidth) / 2), $y, $value, $size, $bold, $color);
            return;
        }
        $this->text($page, $x + 6, $y, $value, $size, $bold, $color);
    }

    private function truncate(string $value, float $availableWidth, float $size): string
    {
        if ($this->estimateWidth($value, $size) <= $availableWidth) return $value;
        $max = max(1, (int) floor($availableWidth / ($size * 0.53)) - 3);
        $cut = function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
        return rtrim($cut).'...';
    }

    private function estimateWidth(string $value, float $size): float
    {
        $encoded = $this->encode($value);
        return strlen($encoded) * $size * 0.53;
    }

    private function rect(int $page, float $x, float $y, float $width, float $height, array $fill): void
    {
        [$r, $g, $b] = $fill;
        $pdfY = self::PAGE_HEIGHT - $y - $height;
        $this->pages[$page][] = sprintf("q %.3F %.3F %.3F rg %.2F %.2F %.2F %.2F re f Q", $r, $g, $b, $x, $pdfY, $width, $height);
    }

    private function line(int $page, float $x1, float $y1, float $x2, float $y2, array $color): void
    {
        [$r, $g, $b] = $color;
        $this->pages[$page][] = sprintf("q %.3F %.3F %.3F RG 0.6 w %.2F %.2F m %.2F %.2F l S Q", $r, $g, $b, $x1, self::PAGE_HEIGHT - $y1, $x2, self::PAGE_HEIGHT - $y2);
    }

    private function image(int $page, float $x, float $y, float $width, float $height): void
    {
        $pdfY = self::PAGE_HEIGHT - $y - $height;
        $this->pages[$page][] = sprintf('q %.2F 0 0 %.2F %.2F %.2F cm /Im1 Do Q', $width, $height, $x, $pdfY);
    }

    private function hasLogo(): bool
    {
        if ($this->logoPath === null || !is_file($this->logoPath)) return false;
        $info = @getimagesize($this->logoPath);
        return $info !== false && ($info[2] ?? null) === IMAGETYPE_JPEG;
    }

    private function text(int $page, float $x, float $y, string $value, float $size, bool $bold, array $color): void
    {
        [$r, $g, $b] = $color;
        $font = $bold ? 'F2' : 'F1';
        $escaped = $this->escape($value);
        $pdfY = self::PAGE_HEIGHT - $y - $size;
        $this->pages[$page][] = sprintf("BT /%s %.2F Tf %.3F %.3F %.3F rg 1 0 0 1 %.2F %.2F Tm (%s) Tj ET", $font, $size, $r, $g, $b, $x, $pdfY, $escaped);
    }

    private function textRight(int $page, float $right, float $y, string $value, float $size, bool $bold, array $color): void
    {
        $this->text($page, $right - $this->estimateWidth($value, $size), $y, $value, $size, $bold, $color);
    }

    private function escape(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $this->encode($value));
    }

    private function encode(string $value): string
    {
        $encoded = iconv('UTF-8', 'Windows-1252//TRANSLIT', $value);
        return $encoded === false ? preg_replace('/[^\x20-\x7E]/', '?', $value) : $encoded;
    }

    private function buildPdf(): string
    {
        $objects = [];
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

        $hasLogo = $this->hasLogo();
        $firstContentObject = 5;
        $xObjectResources = '';
        if ($hasLogo) {
            $logo = file_get_contents($this->logoPath);
            $info = getimagesize($this->logoPath);
            $objects[5] = '<< /Type /XObject /Subtype /Image /Width '.$info[0].' /Height '.$info[1]
                .' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '.strlen($logo)." >>\nstream\n"
                .$logo."\nendstream";
            $firstContentObject = 6;
            $xObjectResources = ' /XObject << /Im1 5 0 R >>';
        }

        $kids = [];
        foreach ($this->pages as $index => $commands) {
            $contentNumber = $firstContentObject + ($index * 2);
            $pageNumber = $contentNumber + 1;
            $stream = implode("\n", $commands)."\n";
            $objects[$contentNumber] = '<< /Length '.strlen($stream)." >>\nstream\n".$stream.'endstream';
            $objects[$pageNumber] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '.self::PAGE_WIDTH.' '.self::PAGE_HEIGHT.'] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>'.$xObjectResources.' >> /Contents '.$contentNumber.' 0 R >>';
            $kids[] = $pageNumber.' 0 R';
        }
        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $kids).'] /Count '.count($kids).' >>';
        ksort($objects);

        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $offsets = [0];
        foreach ($objects as $number => $body) {
            $offsets[$number] = strlen($pdf);
            $pdf .= $number." 0 obj\n".$body."\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }
        $pdf .= 'trailer'."\n<< /Size ".(count($objects) + 1).' /Root 1 0 R >>'."\nstartxref\n".$xref."\n%%EOF";

        return $pdf;
    }
}
