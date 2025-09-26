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
};

type LineElement = {
    id: string;
    x1: number; // Start X in %
    y1: number; // Start Y in %
    x2: number; // End X in %
    y2: number; // End Y in %
    width: number; // Linienstärke
    color: string;
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

    const handleColorChange = (type: string, value: string) => {
        const updatedLogo = { ...logo, [type]: value };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
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
            color: '#FFFFFF'
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
            color: '#FFFFFF'
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
                        style={{ backgroundColor: logo.bgColor }}
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
                                className={`absolute rounded-full cursor-pointer transition-all duration-200 hover:scale-110 ${
                                    logo.selectedDotId === dot.id
                                        ? 'ring-2 ring-blue-500'
                                        : ''
                                }`}
                                style={{
                                    left: `${dot.x}%`,
                                    top: `${dot.y}%`,
                                    width: `${dot.size}px`,
                                    height: `${dot.size}px`,
                                    backgroundColor: dot.color,
                                    transform: 'translate(-50%, -50%)'
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
                            >
                                <line
                                    x1={`${line.x1}%`}
                                    y1={`${line.y1}%`}
                                    x2={`${line.x2}%`}
                                    y2={`${line.y2}%`}
                                    stroke={line.color}
                                    strokeWidth={line.width}
                                    className={`cursor-pointer pointer-events-auto transition-all duration-200 hover:opacity-80 ${
                                        logo.selectedLineId === line.id
                                            ? 'drop-shadow-lg'
                                            : ''
                                    }`}
                                    onClick={() => handleLineClick(line.id)}
                                />
                                {logo.selectedLineId === line.id && (
                                    <>
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
                                    <label htmlFor="bgColor" className="block text-sm font-medium text-gray-300 mb-2">
                                        Hintergrund
                                    </label>
                                    <div className="flex items-center bg-gray-700 rounded-lg px-3">
                                        <input
                                            id="bgColor"
                                            type="color"
                                            value={logo.bgColor}
                                            onChange={(e) => handleColorChange('bgColor', e.target.value)}
                                            className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                                        />
                                        <span className="pl-3 font-mono text-sm">{logo.bgColor}</span>
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
                                                    onClick={() => {
                                                        handleCharacterPropertyChange('glyph', glyphData.char);
                                                        handleCharacterPropertyChange('isLigature', glyphData.isLigature);
                                                        handleCharacterPropertyChange('replacesChars', glyphData.replacesChars);
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
                                            <button
                                                onClick={deleteDot}
                                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                            >
                                                Löschen
                                            </button>
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
                                            <button
                                                onClick={deleteLine}
                                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                            >
                                                Löschen
                                            </button>
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

    // Erstellt die Zeichen-Array aus Text
    const createCharactersFromText = (text: string, color: string): Character[] => {
        return text.split('').map((char, index) => ({
            char,
            color,
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
    const { fontName, bgColor, characters, fontFeatures, dots, lines } = logo;

    const getFontFeatureSettings = () => {
        return fontFeatures
            .map(feature => `"${feature.tag}" ${feature.enabled ? '1' : '0'}`)
            .join(', ');
    };

    return (
        <div
            onClick={onEdit}
            className="p-8 rounded-lg cursor-pointer transform hover:scale-105 transition-all duration-300 relative"
            style={{ backgroundColor: bgColor }}
        >
            <div
                className={`text-5xl text-center break-words relative`}
                style={{
                    fontFeatureSettings: getFontFeatureSettings(),
                    fontFamily: `"${fontName}", sans-serif`
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
                    className="absolute rounded-full"
                    style={{
                        left: `${dot.x}%`,
                        top: `${dot.y}%`,
                        width: `${dot.size}px`,
                        height: `${dot.size}px`,
                        backgroundColor: dot.color,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            ))}

            {/* Linien in der Vorschau */}
            {lines.map((line) => (
                <svg
                    key={line.id}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                >
                    <line
                        x1={`${line.x1}%`}
                        y1={`${line.y1}%`}
                        x2={`${line.x2}%`}
                        y2={`${line.y2}%`}
                        stroke={line.color}
                        strokeWidth={line.width}
                    />
                </svg>
            ))}

            <p className="text-center text-xs text-gray-400 mt-4 opacity-70">{fontName}</p>
        </div>
    );
}
