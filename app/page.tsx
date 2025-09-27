"use client"; // Wichtig! Markiert dies als Client-Komponente

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, X } from 'lucide-react';

// Font-Konfiguration
const FONT_CONFIG: Record<string, { woff2: string; className: string }> = {
    'Aboro': { woff2: '/fonts/Aboro.woff2', className: 'font-aboro' },
    'Abind': { woff2: '/fonts/Abind.woff2', className: 'font-abind' },
    'Abang': { woff2: '/fonts/Abang.woff2', className: 'font-abang' },
    'Cryachy': { woff2: '/fonts/Cryachy.woff2', className: 'font-cryachy' },
    'Garlic': { woff2: '/fonts/Garlic-Regular.woff2', className: 'font-garlic' },
    'Grunell': { woff2: '/fonts/Grunell-Regular.woff2', className: 'font-grunell' },
    'Grunell-Ligature': { woff2: '/fonts/Grunell-Ligature.woff2', className: 'font-grunell-ligature' },
    'Keilla': { woff2: '/fonts/Keilla.woff2', className: 'font-keilla' },
    'Lilatia': { woff2: '/fonts/Lilatia.woff2', className: 'font-lilatia' },
    'Mentol': { woff2: '/fonts/Mentol.woff2', className: 'font-mentol' },
    'Miggle': { woff2: '/fonts/Miggle.woff2', className: 'font-miggle' },
    'Rossea': { woff2: '/fonts/Rossea.woff2', className: 'font-rossea' },
    'Sailor': { woff2: '/fonts/Sailor-Regular.woff2', className: 'font-sailor' },
};

// Types definieren
type Character = {
    char: string;
    color: string;
    index: number;
    size: number; // Relative Größe (1.0 = 100%)
    rotation: number; // Rotation in Grad
    glyph?: string; // Alternative Glyph-Darstellung
    isLigature?: boolean; // Ob es eine Ligatur ist
    replacesChars?: number; // Wie viele Zeichen ersetzt werden
};

type DotElement = {
    id: string;
    x: number; // Position X in %
    y: number; // Position Y in %
    size: number; // Größe
    color: string;
    borderRadius: number; // Border Radius in % (100 = Kreis, 0 = Quadrat)
    rotation: number; // Rotation in Grad
    isEraser: boolean; // Radier-Modus
};

type VectorPoint = {
    x: number; // Position X in %
    y: number; // Position Y in %
};

type LineElement = {
    id: string;
    x1: number; // Start X in %
    y1: number; // Start Y in %
    x2: number; // End X in %
    y2: number; // End Y in %
    width: number; // Linienstärke
    color: string;
    vectorPoints: VectorPoint[]; // Vektorpunkte für gekrümmte Linien
    isEraser: boolean; // Radier-Modus
};

type FontFeature = {
    tag: string;
    name: string;
    enabled: boolean;
};

type Logo = {
    id: string;
    text: string;
    fontName: string;
    textColor: string;
    bgColor: string;
    bgGradient: string | null; // CSS Gradient String oder null für solid color
    characters: Character[];
    fontFeatures: FontFeature[];
    selectedCharIndex: number | null;
    dots: DotElement[];
    selectedDotId: string | null;
    lines: LineElement[];
    selectedLineId: string | null;
};

// --- LogoEditor Komponente (vorher in separater Datei) ---
function LogoEditor({ logo: initialLogo, onClose, onUpdate }: {
    logo: Logo;
    onClose: () => void;
    onUpdate: (logo: Logo) => void;
}) {
    const [logo, setLogo] = useState(initialLogo);

    useEffect(() => {
        setLogo(initialLogo);
    }, [initialLogo]);

    // Aktualisiert alle Zeichen-Farben basierend auf der globalen Textfarbe
    const updateAllCharacterColors = (logo: Logo, newTextColor: string): Logo => {
        const updatedCharacters = logo.characters.map(char => ({ ...char, color: newTextColor }));
        return { ...logo, characters: updatedCharacters };
    };

    const handleColorChange = (type: string, value: string | null) => {
        if (type === 'textColor' && value) {
            // Spezielle Behandlung für Textfarbe - aktualisiert alle Zeichen
            const updatedLogo = updateAllCharacterColors({ ...logo, textColor: value }, value);
            setLogo(updatedLogo);
            onUpdate(updatedLogo);
        } else {
            const updatedLogo = { ...logo, [type]: value };
            setLogo(updatedLogo);
            onUpdate(updatedLogo);
        }
    };

    const handleGradientColorChange = (colorIndex: number, color: string) => {
        if (!logo.bgGradient) return;

        const gradientData = parseGradient(logo.bgGradient);
        gradientData.colors[colorIndex] = color;

        const newGradient = buildGradient(gradientData);
        const updatedLogo = { ...logo, bgGradient: newGradient };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const addGradientColor = () => {
        if (!logo.bgGradient) return;

        const gradientData = parseGradient(logo.bgGradient);
        if (gradientData.colors.length < 4) {
            gradientData.colors.push('#ffffff');
            const newGradient = buildGradient(gradientData);
            const updatedLogo = { ...logo, bgGradient: newGradient };
            setLogo(updatedLogo);
            onUpdate(updatedLogo);
        }
    };

    const removeGradientColor = (colorIndex: number) => {
        if (!logo.bgGradient) return;

        const gradientData = parseGradient(logo.bgGradient);
        if (gradientData.colors.length > 2) {
            gradientData.colors.splice(colorIndex, 1);
            const newGradient = buildGradient(gradientData);
            const updatedLogo = { ...logo, bgGradient: newGradient };
            setLogo(updatedLogo);
            onUpdate(updatedLogo);
        }
    };

    const handleGradientDirectionChange = (direction: string) => {
        if (!logo.bgGradient) return;

        const gradientData = parseGradient(logo.bgGradient);
        gradientData.direction = direction;

        const newGradient = buildGradient(gradientData);
        const updatedLogo = { ...logo, bgGradient: newGradient };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const createNewGradient = () => {
        const newGradient = 'linear-gradient(45deg, #667eea, #764ba2)';
        const updatedLogo = { ...logo, bgGradient: newGradient };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const parseGradient = (gradientString: string) => {
        // Parse CSS gradient string
        const matches = gradientString.match(/linear-gradient\(([^,]+),\s*(.+)\)/);
        if (!matches) return { direction: '45deg', colors: ['#667eea', '#764ba2'] };

        const direction = matches[1].trim();
        const colorPart = matches[2];
        const colors = colorPart.split(',').map(c => c.trim());

        return { direction, colors };
    };

    const buildGradient = (gradientData: { direction: string; colors: string[] }) => {
        return `linear-gradient(${gradientData.direction}, ${gradientData.colors.join(', ')})`;
    };

    const handleCharacterClick = (index: number) => {
        const updatedLogo = { ...logo, selectedCharIndex: index, selectedDotId: null, selectedLineId: null };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const handleDotClick = (dotId: string) => {
        const updatedLogo = { ...logo, selectedDotId: dotId, selectedCharIndex: null, selectedLineId: null };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const handleLineClick = (lineId: string) => {
        const updatedLogo = { ...logo, selectedLineId: lineId, selectedCharIndex: null, selectedDotId: null };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const addDot = () => {
        const newDot: DotElement = {
            id: `dot-${Date.now()}`,
            x: 50,
            y: 50,
            size: 8,
            color: '#FFFFFF',
            borderRadius: 100, // 100% = perfekter Kreis
            rotation: 0, // Keine Rotation
            isEraser: false
        };
        const updatedLogo = {
            ...logo,
            dots: [...logo.dots, newDot],
            selectedDotId: newDot.id,
            selectedCharIndex: null,
            selectedLineId: null
        };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const updateDot = (property: keyof DotElement, value: any) => {
        if (!logo.selectedDotId) return;

        const updatedDots = logo.dots.map(dot =>
            dot.id === logo.selectedDotId
                ? { ...dot, [property]: value }
                : dot
        );

        const updatedLogo = { ...logo, dots: updatedDots };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const deleteDot = () => {
        if (!logo.selectedDotId) return;

        const updatedDots = logo.dots.filter(dot => dot.id !== logo.selectedDotId);
        const updatedLogo = {
            ...logo,
            dots: updatedDots,
            selectedDotId: null
        };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const addLine = () => {
        const newLine: LineElement = {
            id: `line-${Date.now()}`,
            x1: 20,
            y1: 50,
            x2: 80,
            y2: 50,
            width: 2,
            color: '#FFFFFF',
            vectorPoints: [], // Leere Liste für gerade Linie
            isEraser: false
        };
        const updatedLogo = {
            ...logo,
            lines: [...logo.lines, newLine],
            selectedLineId: newLine.id,
            selectedCharIndex: null,
            selectedDotId: null
        };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const updateLine = (property: keyof LineElement, value: any) => {
        if (!logo.selectedLineId) return;

        const updatedLines = logo.lines.map(line =>
            line.id === logo.selectedLineId
                ? { ...line, [property]: value }
                : line
        );

        const updatedLogo = { ...logo, lines: updatedLines };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const deleteLine = () => {
        if (!logo.selectedLineId) return;

        const updatedLines = logo.lines.filter(line => line.id !== logo.selectedLineId);
        const updatedLogo = {
            ...logo,
            lines: updatedLines,
            selectedLineId: null
        };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const addVectorPoint = () => {
        if (!logo.selectedLineId) return;

        const selectedLine = logo.lines.find(l => l.id === logo.selectedLineId);
        if (!selectedLine) return;

        // Neuen Vektorpunkt in der Mitte zwischen Start und Ende hinzufügen
        const midX = (selectedLine.x1 + selectedLine.x2) / 2;
        const midY = (selectedLine.y1 + selectedLine.y2) / 2;

        const newVectorPoint: VectorPoint = { x: midX, y: midY };

        const updatedLines = logo.lines.map(line =>
            line.id === logo.selectedLineId
                ? { ...line, vectorPoints: [...line.vectorPoints, newVectorPoint] }
                : line
        );

        const updatedLogo = { ...logo, lines: updatedLines };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const removeVectorPoint = (pointIndex: number) => {
        if (!logo.selectedLineId) return;

        const updatedLines = logo.lines.map(line =>
            line.id === logo.selectedLineId
                ? { ...line, vectorPoints: line.vectorPoints.filter((_, index) => index !== pointIndex) }
                : line
        );

        const updatedLogo = { ...logo, lines: updatedLines };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const updateVectorPoint = (pointIndex: number, property: keyof VectorPoint, value: number) => {
        if (!logo.selectedLineId) return;

        const updatedLines = logo.lines.map(line =>
            line.id === logo.selectedLineId
                ? {
                    ...line,
                    vectorPoints: line.vectorPoints.map((point, index) =>
                        index === pointIndex ? { ...point, [property]: value } : point
                    )
                }
                : line
        );

        const updatedLogo = { ...logo, lines: updatedLines };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    // Erstellt einen SVG-Pfad aus Start-, End- und Vektorpunkten
    const createSVGPath = (line: LineElement): string => {
        if (line.vectorPoints.length === 0) {
            // Gerade Linie
            return `M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`;
        } else {
            // Gekrümmte Linie mit Vektorpunkten
            let path = `M ${line.x1} ${line.y1}`;

            if (line.vectorPoints.length === 1) {
                // Quadratische Kurve mit einem Kontrollpunkt
                const cp = line.vectorPoints[0];
                path += ` Q ${cp.x} ${cp.y} ${line.x2} ${line.y2}`;
            } else {
                // Kubische Bezier-Kurve oder mehrere Segmente
                for (let i = 0; i < line.vectorPoints.length; i++) {
                    const cp = line.vectorPoints[i];
                    if (i === line.vectorPoints.length - 1) {
                        // Letzter Punkt -> zur Endposition
                        path += ` Q ${cp.x} ${cp.y} ${line.x2} ${line.y2}`;
                    } else {
                        // Zwischen-Vektorpunkt
                        const nextCp = line.vectorPoints[i + 1];
                        const midX = (cp.x + nextCp.x) / 2;
                        const midY = (cp.y + nextCp.y) / 2;
                        path += ` Q ${cp.x} ${cp.y} ${midX} ${midY}`;
                    }
                }
            }

            return path;
        }
    };

    const handleCharacterPropertyChange = (property: keyof Character, value: any) => {
        if (logo.selectedCharIndex === null) return;

        const updatedCharacters = [...logo.characters];
        updatedCharacters[logo.selectedCharIndex] = {
            ...updatedCharacters[logo.selectedCharIndex],
            [property]: value
        };

        const updatedLogo = { ...logo, characters: updatedCharacters };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    // Generiere verfügbare Glyphen für den aktuellen Font
    const getAvailableGlyphs = (fontName: string): Array<{char: string, isLigature: boolean, replacesChars: number}> => {
        const baseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
        const extendedChars = 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ';
        const symbols = '←→↑↓↔↕↖↗↘↙⇐⇑⇒⇓⇔⇕⇖⇗⇘⇙★☆♠♣♥♦♪♫☀☁☂☃❄';

        // Standard Zeichen (ersetzen 1 Zeichen)
        const standardGlyphs = (baseChars + specialChars + extendedChars + symbols)
            .split('')
            .map(char => ({ char, isLigature: false, replacesChars: 1 }));

        // Ligaturen (ersetzen 2+ Zeichen) - fontspezifisch
        const ligatures: Array<{char: string, isLigature: boolean, replacesChars: number}> = [];

        if (fontName === 'Aboro' || fontName === 'Abind' || fontName === 'Abang') {
            ligatures.push(
                { char: 'ﬀ', isLigature: true, replacesChars: 2 }, // ff
                { char: 'ﬁ', isLigature: true, replacesChars: 2 }, // fi
                { char: 'ﬂ', isLigature: true, replacesChars: 2 }, // fl
                { char: 'ﬃ', isLigature: true, replacesChars: 3 }, // ffi
                { char: 'ﬄ', isLigature: true, replacesChars: 3 }, // ffl
                { char: 'Æ', isLigature: true, replacesChars: 2 }, // AE
                { char: 'æ', isLigature: true, replacesChars: 2 }, // ae
                { char: 'Œ', isLigature: true, replacesChars: 2 }, // OE
                { char: 'œ', isLigature: true, replacesChars: 2 }  // oe
            );
        }

        return [...standardGlyphs, ...ligatures];
    };

    const toggleFontFeature = (featureTag: string) => {
        const updatedFeatures = logo.fontFeatures.map(feature =>
            feature.tag === featureTag
                ? { ...feature, enabled: !feature.enabled }
                : feature
        );

        const updatedLogo = { ...logo, fontFeatures: updatedFeatures };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const getFontFeatureSettings = () => {
        return logo.fontFeatures
            .map(feature => `"${feature.tag}" ${feature.enabled ? '1' : '0'}`)
            .join(', ');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl relative animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
                    aria-label="Editor schließen"
                >
                    <X size={24} />
                </button>
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-6 text-center">Logo bearbeiten</h2>

                    {/* Vorschau-Bereich mit klickbaren Buchstaben und Punkten */}
                    <div
                        className="p-8 rounded-lg mb-6 transition-colors duration-300 relative"
                        style={{
                            background: logo.bgGradient || logo.bgColor
                        }}
                    >
                        <div
                            className={`text-6xl text-center break-words cursor-pointer relative`}
                            style={{
                                fontFeatureSettings: getFontFeatureSettings(),
                                fontFamily: `"${logo.fontName}", sans-serif`
                            }}
                        >
                            {logo.characters.map((char, index) => (
                                <span
                                    key={index}
                                    className={`inline-block transition-all duration-200 hover:scale-110 ${
                                        logo.selectedCharIndex === index
                                            ? 'bg-blue-500 bg-opacity-30 rounded'
                                            : ''
                                    }`}
                                    style={{
                                        color: char.color,
                                        transform: `scale(${char.size}) rotate(${char.rotation}deg)`,
                                        transformOrigin: 'center center',
                                        display: 'inline-block'
                                    }}
                                    onClick={() => handleCharacterClick(index)}
                                >
                                    {char.glyph || char.char}
                                </span>
                            ))}
                        </div>

                        {/* Punkte */}
                        {logo.dots.map((dot) => (
                            <div
                                key={dot.id}
                                className={`absolute cursor-pointer transition-all duration-200 hover:scale-110 ${
                                    logo.selectedDotId === dot.id
                                        ? 'ring-2 ring-blue-500'
                                        : ''
                                } ${
                                    dot.isEraser ? 'opacity-50' : ''
                                }`}
                                style={{
                                    left: `${dot.x}%`,
                                    top: `${dot.y}%`,
                                    width: `${dot.size}px`,
                                    height: `${dot.size}px`,
                                    backgroundColor: dot.isEraser ? 'transparent' : dot.color,
                                    border: dot.isEraser ? `2px dashed ${dot.color}` : 'none',
                                    borderRadius: `${dot.borderRadius}%`,
                                    mixBlendMode: dot.isEraser ? 'difference' : 'normal',
                                    transform: `translate(-50%, -50%) rotate(${dot.rotation}deg)`
                                }}
                                onClick={() => handleDotClick(dot.id)}
                            />
                        ))}

                        {/* Linien */}
                        {logo.lines.map((line) => (
                            <svg
                                key={line.id}
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                style={{ zIndex: 1 }}
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                            >
                                <path
                                    d={createSVGPath(line)}
                                    stroke={line.color}
                                    strokeWidth={line.width}
                                    strokeDasharray={line.isEraser ? '5,5' : 'none'}
                                    opacity={line.isEraser ? 0.7 : 1}
                                    fill="none"
                                    style={{
                                        mixBlendMode: line.isEraser ? 'difference' : 'normal'
                                    }}
                                    className={`cursor-pointer pointer-events-auto transition-all duration-200 hover:opacity-80 ${
                                        logo.selectedLineId === line.id
                                            ? 'drop-shadow-lg'
                                            : ''
                                    }`}
                                    onClick={() => handleLineClick(line.id)}
                                />
                                {logo.selectedLineId === line.id && (
                                    <>
                                        {/* Start- und Endpunkte */}
                                        <circle
                                            cx={`${line.x1}%`}
                                            cy={`${line.y1}%`}
                                            r="4"
                                            fill="blue"
                                            className="pointer-events-none"
                                        />
                                        <circle
                                            cx={`${line.x2}%`}
                                            cy={`${line.y2}%`}
                                            r="4"
                                            fill="blue"
                                            className="pointer-events-none"
                                        />
                                        {/* Vektorpunkte */}
                                        {line.vectorPoints.map((point, index) => (
                                            <circle
                                                key={index}
                                                cx={`${point.x}%`}
                                                cy={`${point.y}%`}
                                                r="3"
                                                fill="orange"
                                                stroke="white"
                                                strokeWidth="1"
                                                className="pointer-events-none"
                                            />
                                        ))}
                                    </>
                                )}
                            </svg>
                        ))}
                    </div>

                    {/* Steuerungs-Bereich */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Globale Farben */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200">Globale Farben</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="textColor" className="block text-sm font-medium text-gray-300 mb-2">
                                        Standard Textfarbe
                                    </label>
                                    <div className="flex items-center bg-gray-700 rounded-lg px-3">
                                        <input
                                            id="textColor"
                                            type="color"
                                            value={logo.textColor}
                                            onChange={(e) => handleColorChange('textColor', e.target.value)}
                                            className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                                        />
                                        <span className="pl-3 font-mono text-sm">{logo.textColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Hintergrund
                                    </label>
                                    <div className="space-y-2">
                                        {/* Solid Color */}
                                        <div className="flex items-center bg-gray-700 rounded-lg px-3">
                                            <input
                                                type="color"
                                                value={logo.bgColor}
                                                onChange={(e) => {
                                                    handleColorChange('bgColor', e.target.value);
                                                    handleColorChange('bgGradient', null);
                                                }}
                                                className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                                            />
                                            <span className="pl-3 font-mono text-sm">{logo.bgColor}</span>
                                        </div>

                                        {/* Dynamic Gradient Creator */}
                                        <div className="space-y-3">
                                            {!logo.bgGradient ? (
                                                <button
                                                    onClick={createNewGradient}
                                                    className="w-full py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                                                >
                                                    + Gradient erstellen
                                                </button>
                                            ) : (
                                                <div className="space-y-2">
                                                    {/* Direction Control */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-300 mb-1">Richtung</label>
                                                        <select
                                                            value={logo.bgGradient ? parseGradient(logo.bgGradient).direction : '45deg'}
                                                            onChange={(e) => handleGradientDirectionChange(e.target.value)}
                                                            className="w-full bg-gray-600 text-white text-xs rounded px-2 py-1"
                                                        >
                                                            <option value="45deg">↗ Diagonal (45°)</option>
                                                            <option value="90deg">→ Horizontal</option>
                                                            <option value="180deg">↓ Vertikal</option>
                                                            <option value="135deg">↘ Diagonal (135°)</option>
                                                            <option value="0deg">↑ Nach oben</option>
                                                            <option value="225deg">↙ Diagonal (225°)</option>
                                                            <option value="270deg">← Nach links</option>
                                                            <option value="315deg">↖ Diagonal (315°)</option>
                                                        </select>
                                                    </div>

                                                    {/* Color Controls */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-300 mb-1">Farben</label>
                                                        <div className="space-y-1">
                                                            {logo.bgGradient ? parseGradient(logo.bgGradient).colors.map((color, colorIndex) => (
                                                                <div key={colorIndex} className="flex items-center gap-2">
                                                                    <input
                                                                        type="color"
                                                                        value={color}
                                                                        onChange={(e) => handleGradientColorChange(colorIndex, e.target.value)}
                                                                        className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer rounded"
                                                                    />
                                                                    <span className="font-mono text-xs flex-1">{color}</span>
                                                                    {logo.bgGradient && parseGradient(logo.bgGradient).colors.length > 2 && (
                                                                        <button
                                                                            onClick={() => removeGradientColor(colorIndex)}
                                                                            className="text-red-400 hover:text-red-300 text-xs"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )) : null}
                                                        </div>

                                                        {logo.bgGradient && parseGradient(logo.bgGradient).colors.length < 4 && (
                                                            <button
                                                                onClick={addGradientColor}
                                                                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                                                            >
                                                                + Farbe hinzufügen
                                                            </button>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleColorChange('bgGradient', null)}
                                                        className="text-xs text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        Gradient entfernen
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Einzelzeichen-Bearbeitung */}
                            {logo.selectedCharIndex !== null && (
                                <div className="space-y-4">
                                    <h4 className="text-md font-semibold text-gray-200">
                                        Bearbeitung: "{logo.characters[logo.selectedCharIndex].char}"
                                    </h4>

                                    {/* Farbe */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Farbe
                                        </label>
                                        <div className="flex items-center bg-gray-700 rounded-lg px-3">
                                            <input
                                                type="color"
                                                value={logo.characters[logo.selectedCharIndex].color}
                                                onChange={(e) => handleCharacterPropertyChange('color', e.target.value)}
                                                className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                                            />
                                            <span className="pl-3 font-mono text-sm">
                                                {logo.characters[logo.selectedCharIndex].color}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Größe */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Größe: {Math.round(logo.characters[logo.selectedCharIndex].size * 100)}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2"
                                            step="0.1"
                                            value={logo.characters[logo.selectedCharIndex].size}
                                            onChange={(e) => handleCharacterPropertyChange('size', parseFloat(e.target.value))}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Rotation */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Rotation: {logo.characters[logo.selectedCharIndex].rotation}°
                                        </label>
                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            step="5"
                                            value={logo.characters[logo.selectedCharIndex].rotation}
                                            onChange={(e) => handleCharacterPropertyChange('rotation', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    {/* Glyph-Auswahl */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Zeichen ändern
                                        </label>
                                        <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto bg-gray-700 rounded-lg p-2">
                                            {getAvailableGlyphs(logo.fontName).map((glyphData, glyphIndex) => (
                                                <button
                                                    key={glyphIndex}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleCharacterPropertyChange('glyph', glyphData.char);
                                                        if (glyphData.isLigature) {
                                                            handleCharacterPropertyChange('isLigature', glyphData.isLigature);
                                                            handleCharacterPropertyChange('replacesChars', glyphData.replacesChars);
                                                        }
                                                    }}
                                                    className={`w-8 h-8 text-center hover:bg-gray-600 rounded transition-colors ${
                                                        logo.selectedCharIndex !== null && logo.characters[logo.selectedCharIndex].glyph === glyphData.char
                                                            ? 'bg-blue-500'
                                                            : glyphData.isLigature
                                                            ? 'bg-purple-800'
                                                            : 'bg-gray-800'
                                                    }`}
                                                    style={{
                                                        fontSize: '14px',
                                                        fontFamily: `"${logo.fontName}", sans-serif`
                                                    }}
                                                    title={glyphData.isLigature ? `Ligatur (ersetzt ${glyphData.replacesChars} Zeichen)` : 'Standard Zeichen'}
                                                >
                                                    {glyphData.char}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Elemente und Font Features */}
                        <div className="space-y-4">
                            {/* Punkte und Linien Steuerung */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-200">Elemente</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={addDot}
                                            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                                        >
                                            + Punkt
                                        </button>
                                        <button
                                            onClick={addLine}
                                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                                        >
                                            + Linie
                                        </button>
                                    </div>
                                </div>

                                {logo.selectedDotId && (
                                    <div className="space-y-3 bg-gray-700 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-gray-200">Punkt bearbeiten</h4>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => updateDot('isEraser', !logo.dots.find(d => d.id === logo.selectedDotId)?.isEraser)}
                                                    className={`px-2 py-1 text-white rounded text-xs transition-colors ${
                                                        logo.dots.find(d => d.id === logo.selectedDotId)?.isEraser
                                                            ? 'bg-orange-500 hover:bg-orange-600'
                                                            : 'bg-blue-500 hover:bg-blue-600'
                                                    }`}
                                                >
                                                    {logo.dots.find(d => d.id === logo.selectedDotId)?.isEraser ? '🧽' : '🖊️'}
                                                </button>
                                                <button
                                                    onClick={deleteDot}
                                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        {/* Farbe */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-300 mb-1">Farbe</label>
                                            <div className="flex items-center bg-gray-600 rounded px-2">
                                                <input
                                                    type="color"
                                                    value={logo.dots.find(d => d.id === logo.selectedDotId)?.color || '#FFFFFF'}
                                                    onChange={(e) => updateDot('color', e.target.value)}
                                                    className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                                />
                                                <span className="pl-2 font-mono text-xs">
                                                    {logo.dots.find(d => d.id === logo.selectedDotId)?.color}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Größe */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-300 mb-1">
                                                Größe: {logo.dots.find(d => d.id === logo.selectedDotId)?.size}px
                                            </label>
                                            <input
                                                type="range"
                                                min="2"
                                                max="30"
                                                value={logo.dots.find(d => d.id === logo.selectedDotId)?.size || 8}
                                                onChange={(e) => updateDot('size', parseInt(e.target.value))}
                                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        {/* Border Radius */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-300 mb-1">
                                                Form: {logo.dots.find(d => d.id === logo.selectedDotId)?.borderRadius === 100 ? 'Kreis' : logo.dots.find(d => d.id === logo.selectedDotId)?.borderRadius === 0 ? 'Quadrat' : 'Abgerundet'} ({logo.dots.find(d => d.id === logo.selectedDotId)?.borderRadius}%)
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={logo.dots.find(d => d.id === logo.selectedDotId)?.borderRadius || 100}
                                                onChange={(e) => updateDot('borderRadius', parseInt(e.target.value))}
                                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        {/* Rotation */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-300 mb-1">
                                                Rotation: {logo.dots.find(d => d.id === logo.selectedDotId)?.rotation}°
                                            </label>
                                            <input
                                                type="range"
                                                min="-180"
                                                max="180"
                                                step="5"
                                                value={logo.dots.find(d => d.id === logo.selectedDotId)?.rotation || 0}
                                                onChange={(e) => updateDot('rotation', parseInt(e.target.value))}
                                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        {/* Position */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-300 mb-1">
                                                    X: {logo.dots.find(d => d.id === logo.selectedDotId)?.x}%
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={logo.dots.find(d => d.id === logo.selectedDotId)?.x || 50}
                                                    onChange={(e) => updateDot('x', parseInt(e.target.value))}
                                                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-300 mb-1">
                                                    Y: {logo.dots.find(d => d.id === logo.selectedDotId)?.y}%
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={logo.dots.find(d => d.id === logo.selectedDotId)?.y || 50}
                                                    onChange={(e) => updateDot('y', parseInt(e.target.value))}
                                                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {logo.selectedLineId && (
                                    <div className="space-y-3 bg-gray-700 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-gray-200">Linie bearbeiten</h4>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => updateLine('isEraser', !logo.lines.find(l => l.id === logo.selectedLineId)?.isEraser)}
                                                    className={`px-2 py-1 text-white rounded text-xs transition-colors ${
                                                        logo.lines.find(l => l.id === logo.selectedLineId)?.isEraser
                                                            ? 'bg-orange-500 hover:bg-orange-600'
                                                            : 'bg-blue-500 hover:bg-blue-600'
                                                    }`}
                                                >
                                                    {logo.lines.find(l => l.id === logo.selectedLineId)?.isEraser ? '🧽' : '🖊️'}
                                                </button>
                                                <button
                                                    onClick={deleteLine}
                                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        {/* Farbe */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-300 mb-1">Farbe</label>
                                            <div className="flex items-center bg-gray-600 rounded px-2">
                                                <input
                                                    type="color"
                                                    value={logo.lines.find(l => l.id === logo.selectedLineId)?.color || '#FFFFFF'}
                                                    onChange={(e) => updateLine('color', e.target.value)}
                                                    className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                                />
                                                <span className="pl-2 font-mono text-xs">
                                                    {logo.lines.find(l => l.id === logo.selectedLineId)?.color}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Linienstärke */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-300 mb-1">
                                                Stärke: {logo.lines.find(l => l.id === logo.selectedLineId)?.width}px
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={logo.lines.find(l => l.id === logo.selectedLineId)?.width || 2}
                                                onChange={(e) => updateLine('width', parseInt(e.target.value))}
                                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        {/* Position Start */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-300 mb-1">Start Position</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">
                                                        X1: {logo.lines.find(l => l.id === logo.selectedLineId)?.x1}%
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={logo.lines.find(l => l.id === logo.selectedLineId)?.x1 || 20}
                                                        onChange={(e) => updateLine('x1', parseInt(e.target.value))}
                                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">
                                                        Y1: {logo.lines.find(l => l.id === logo.selectedLineId)?.y1}%
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={logo.lines.find(l => l.id === logo.selectedLineId)?.y1 || 50}
                                                        onChange={(e) => updateLine('y1', parseInt(e.target.value))}
                                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Position End */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-300 mb-1">End Position</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">
                                                        X2: {logo.lines.find(l => l.id === logo.selectedLineId)?.x2}%
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={logo.lines.find(l => l.id === logo.selectedLineId)?.x2 || 80}
                                                        onChange={(e) => updateLine('x2', parseInt(e.target.value))}
                                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">
                                                        Y2: {logo.lines.find(l => l.id === logo.selectedLineId)?.y2}%
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={logo.lines.find(l => l.id === logo.selectedLineId)?.y2 || 50}
                                                        onChange={(e) => updateLine('y2', parseInt(e.target.value))}
                                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vektorpunkte */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-xs font-medium text-gray-300">
                                                    Kurven-Punkte ({logo.lines.find(l => l.id === logo.selectedLineId)?.vectorPoints.length || 0})
                                                </label>
                                                <button
                                                    onClick={addVectorPoint}
                                                    className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                                                >
                                                    + Punkt
                                                </button>
                                            </div>

                                            {logo.lines.find(l => l.id === logo.selectedLineId)?.vectorPoints.map((point, index) => (
                                                <div key={index} className="bg-gray-600 rounded p-2 mb-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs text-gray-300">Punkt {index + 1}</span>
                                                        <button
                                                            onClick={() => removeVectorPoint(index)}
                                                            className="text-red-400 hover:text-red-300 text-xs"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-xs text-gray-400 mb-1">
                                                                X: {point.x.toFixed(1)}%
                                                            </label>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={point.x}
                                                                onChange={(e) => updateVectorPoint(index, 'x', parseInt(e.target.value))}
                                                                className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-400 mb-1">
                                                                Y: {point.y.toFixed(1)}%
                                                            </label>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={point.y}
                                                                onChange={(e) => updateVectorPoint(index, 'y', parseInt(e.target.value))}
                                                                className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )) || null}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Font Features */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-200 mb-3">
                                    Font Features ({logo.fontName})
                                </h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {logo.fontFeatures.map((feature) => (
                                        <div key={feature.tag} className="flex items-center justify-between bg-gray-700 rounded-lg p-2">
                                            <div>
                                                <span className="font-medium text-gray-200 text-sm">{feature.name}</span>
                                                <span className="text-xs text-gray-400 ml-2">({feature.tag})</span>
                                            </div>
                                            <button
                                                onClick={() => toggleFontFeature(feature.tag)}
                                                className={`w-10 h-5 rounded-full transition-colors ${
                                                    feature.enabled
                                                        ? 'bg-blue-500'
                                                        : 'bg-gray-600'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                                    feature.enabled ? 'translate-x-5' : 'translate-x-0.5'
                                                }`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Klicken Sie auf einzelne Buchstaben, um sie individuell zu bearbeiten
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- Hauptseite ---
export default function HomePage() {
    const [text, setText] = useState('LogoType');
    const [logos, setLogos] = useState<Logo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingLogo, setEditingLogo] = useState<Logo | null>(null);
    // Opentype.js wird nicht mehr benötigt, da wir nur WOFF2 Fonts haben

    // Memoized Font Cache, um Schrift-Analyse nur einmal pro Font durchzuführen
    const fontCache = useMemo(() => new Map(), []);

    const getFontData = useCallback(async (fontName: string) => {
        // Vereinfachte Version ohne opentype.js da nur WOFF2 Dateien verfügbar sind
        if (fontCache.has(fontName)) {
            return fontCache.get(fontName);
        }
        const data = { fontName };
        fontCache.set(fontName, data);
        return data;
    }, [fontCache]);

    // Erstellt die Zeichen-Array aus Text - aktualisiert Farben wenn nötig
    const createCharactersFromText = (text: string, textColor: string): Character[] => {
        return text.split('').map((char, index) => ({
            char,
            color: textColor,
            index,
            size: 1.0,
            rotation: 0,
            glyph: char,
            isLigature: false,
            replacesChars: 1
        }));
    };

    // Standard Font Features für verschiedene Fonts
    const getDefaultFontFeatures = (fontName: string): FontFeature[] => {
        const commonFeatures: FontFeature[] = [
            { tag: 'liga', name: 'Standard Ligaturen', enabled: true },
            { tag: 'clig', name: 'Kontextuelle Ligaturen', enabled: true },
            { tag: 'kern', name: 'Kerning', enabled: true },
            { tag: 'dlig', name: 'Diskrete Ligaturen', enabled: false },
            { tag: 'swsh', name: 'Swash-Zeichen', enabled: false },
            { tag: 'calt', name: 'Kontextuelle Alternativen', enabled: false },
            { tag: 'ss01', name: 'Stylistic Set 1', enabled: false },
            { tag: 'ss02', name: 'Stylistic Set 2', enabled: false },
            { tag: 'ss03', name: 'Stylistic Set 3', enabled: false },
            { tag: 'salt', name: 'Stilistische Alternativen', enabled: false }
        ];

        // Je nach Font können verschiedene Features verfügbar sein
        return commonFeatures;
    };

    // Generiert die initialen Logo-Daten
    const generateInitialLogos = useCallback(async (currentText: string) => {
        if (!currentText) {
            setLogos([]);
            return;
        }
        setIsLoading(true);
        const generated: Logo[] = [];
        for (const fontName in FONT_CONFIG) {
            await getFontData(fontName); // Stellt sicher, dass die Schrift gecached ist

            const defaultColor = '#FFFFFF';
            generated.push({
                id: `${fontName}-${currentText}`,
                text: currentText,
                fontName,
                textColor: defaultColor,
                bgColor: '#1F2937',
                bgGradient: null,
                characters: createCharactersFromText(currentText, defaultColor),
                fontFeatures: getDefaultFontFeatures(fontName),
                selectedCharIndex: null,
                dots: [],
                selectedDotId: null,
                lines: [],
                selectedLineId: null
            });
        }
        setLogos(generated);
        setIsLoading(false);
    }, [getFontData]);

    // Effekt, der bei Textänderung die Logos neu generiert (mit Debounce)
    useEffect(() => {
        const handler = setTimeout(() => {
            generateInitialLogos(text);
        }, 500);
        return () => clearTimeout(handler);
    }, [text, generateInitialLogos]);

    const handleUpdateLogo = (updatedLogo: Logo) => {
        setLogos(logos.map(logo => logo.id === updatedLogo.id ? updatedLogo : logo));
        setEditingLogo(updatedLogo); // Auch den Zustand im Editor aktualisieren
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Next.js Logo-Generator
                </h1>
                <p className="text-gray-400 mt-2">Mobile-First. Lokale Fonts. Professionelles Setup.</p>
            </header>

            <main>
                <div className="max-w-xl mx-auto mb-10">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Markenname hier eingeben..."
                        className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-lg text-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>

                {isLoading && (
                    <div className="flex justify-center items-center my-10">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                        <p className="ml-4 text-gray-400">Generiere Vorschau...</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {logos.map((logo) => (
                        <LogoCard key={logo.id} logo={logo} onEdit={() => setEditingLogo(logo)} />
                    ))}
                </div>
            </main>

            {editingLogo && (
                <LogoEditor
                    logo={editingLogo}
                    onClose={() => setEditingLogo(null)}
                    onUpdate={handleUpdateLogo}
                />
            )}
        </div>
    );
}

// Logo-Vorschau-Karte als separate Komponente
function LogoCard({ logo, onEdit }: {
    logo: Logo;
    onEdit: () => void;
}) {
    const { bgColor, bgGradient, characters, fontFeatures, dots, lines } = logo;

    const getFontFeatureSettings = () => {
        return fontFeatures
            .map(feature => `"${feature.tag}" ${feature.enabled ? '1' : '0'}`)
            .join(', ');
    };

    // Erstellt einen SVG-Pfad für die Vorschau
    const createSVGPath = (line: LineElement): string => {
        if (line.vectorPoints.length === 0) {
            return `M ${line.x1} ${line.y1} L ${line.x2} ${line.y2}`;
        } else {
            let path = `M ${line.x1} ${line.y1}`;
            if (line.vectorPoints.length === 1) {
                const cp = line.vectorPoints[0];
                path += ` Q ${cp.x} ${cp.y} ${line.x2} ${line.y2}`;
            } else {
                for (let i = 0; i < line.vectorPoints.length; i++) {
                    const cp = line.vectorPoints[i];
                    if (i === line.vectorPoints.length - 1) {
                        path += ` Q ${cp.x} ${cp.y} ${line.x2} ${line.y2}`;
                    } else {
                        const nextCp = line.vectorPoints[i + 1];
                        const midX = (cp.x + nextCp.x) / 2;
                        const midY = (cp.y + nextCp.y) / 2;
                        path += ` Q ${cp.x} ${cp.y} ${midX} ${midY}`;
                    }
                }
            }
            return path;
        }
    };

    return (
        <div
            onClick={onEdit}
            className="p-8 rounded-lg cursor-pointer transform hover:scale-105 transition-all duration-300 relative"
            style={{
                background: bgGradient || bgColor
            }}
        >
            <div
                className={`text-5xl text-center break-words relative`}
                style={{
                    fontFeatureSettings: getFontFeatureSettings(),
                    fontFamily: `"${logo.fontName}", sans-serif`
                }}
            >
                {characters.map((char, index) => (
                    <span
                        key={index}
                        style={{
                            color: char.color,
                            transform: `scale(${char.size}) rotate(${char.rotation}deg)`,
                            transformOrigin: 'center center',
                            display: 'inline-block'
                        }}
                    >
                        {char.glyph || char.char}
                    </span>
                ))}
            </div>

            {/* Punkte in der Vorschau */}
            {dots.map((dot) => (
                <div
                    key={dot.id}
                    className={`absolute ${
                        dot.isEraser ? 'opacity-50' : ''
                    }`}
                    style={{
                        left: `${dot.x}%`,
                        top: `${dot.y}%`,
                        width: `${dot.size}px`,
                        height: `${dot.size}px`,
                        backgroundColor: dot.isEraser ? 'transparent' : dot.color,
                        border: dot.isEraser ? `1px dashed ${dot.color}` : 'none',
                        borderRadius: `${dot.borderRadius}%`,
                        mixBlendMode: dot.isEraser ? 'difference' : 'normal',
                        transform: `translate(-50%, -50%) rotate(${dot.rotation}deg)`
                    }}
                />
            ))}

            {/* Linien in der Vorschau */}
            {lines.map((line) => (
                <svg
                    key={line.id}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <path
                        d={createSVGPath(line)}
                        stroke={line.color}
                        strokeWidth={line.width}
                        strokeDasharray={line.isEraser ? '3,3' : 'none'}
                        opacity={line.isEraser ? 0.7 : 1}
                        fill="none"
                        style={{
                            mixBlendMode: line.isEraser ? 'difference' : 'normal'
                        }}
                        className=""
                    />
                </svg>
            ))}

            <p className="text-center text-xs text-gray-400 mt-4 opacity-70">{logo.fontName}</p>
        </div>
    );
}
