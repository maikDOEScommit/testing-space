"use client"; // Wichtig! Markiert dies als Client-Komponente

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, X, Palette } from 'lucide-react';
import Link from 'next/link';

// Color palette page is now standalone - no import needed

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
    borderWidth: number; // Border Dicke in px
    borderColor: string; // Border Farbe
    opacity: number; // Transparenz (0-100)
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
    borderWidth: number; // Border Dicke in px (Outline um die Linie)
    borderColor: string; // Border Farbe
    borderRadius: number; // Border Radius für abgerundete Linienenden
};

type FontFeature = {
    tag: string;
    name: string;
    enabled: boolean;
};

type Layer = {
    id: string;
    name: string;
    type: 'logo' | 'dots' | 'lines';
    visible: boolean;
    locked: boolean;
    order: number; // Z-Index order (higher = on top)
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
    // Neue Logo-Layout Features
    slogan: string;
    useIcon: boolean;
    layout: 'wordmark' | 'lok' | 'schub' | 'star'; // Layout-Prinzipien
    iconSymbol: string; // Unicode-Symbol oder Emoji für das Icon
    // Ebenen-System
    layers: Layer[];
    selectedLayerId: string | null;
};

// --- LogoEditor Komponente (vorher in separater Datei) ---
function LogoEditor({ logo: initialLogo, onClose, onUpdate }: {
    logo: Logo;
    onClose: () => void;
    onUpdate: (logo: Logo) => void;
}) {
    const [logo, setLogo] = useState(initialLogo);
    const [isDragging, setIsDragging] = useState<{type: 'dot' | 'vector' | 'lineEnd' | 'layer', id: string, pointIndex?: number, endPoint?: 'start' | 'end'} | null>(null);
    const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
    const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);

    useEffect(() => {
        // Initialize default layers if they don't exist
        if (!initialLogo.layers || initialLogo.layers.length === 0) {
            const defaultLayers: Layer[] = [
                {
                    id: 'logo-layer',
                    name: 'Logo',
                    type: 'logo',
                    visible: true,
                    locked: false,
                    order: 1
                },
                {
                    id: 'dots-layer',
                    name: 'Punkte',
                    type: 'dots',
                    visible: true,
                    locked: false,
                    order: 2
                },
                {
                    id: 'lines-layer',
                    name: 'Linien',
                    type: 'lines',
                    visible: true,
                    locked: false,
                    order: 3
                }
            ];

            const logoWithLayers = {
                ...initialLogo,
                layers: defaultLayers,
                selectedLayerId: null
            };
            setLogo(logoWithLayers);
            onUpdate(logoWithLayers);
        } else {
            setLogo(initialLogo);
        }
    }, [initialLogo, onUpdate]);

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

    const handleLayerClick = (layerId: string) => {
        const updatedLogo = { ...logo, selectedLayerId: layerId, selectedCharIndex: null, selectedDotId: null, selectedLineId: null };
        setLogo(updatedLogo);
        onUpdate(updatedLogo);
    };

    const updateLayer = useCallback((layerId: string, property: keyof Layer, value: string | number | boolean) => {
        setLogo(prevLogo => {
            const updatedLayers = prevLogo.layers.map(layer =>
                layer.id === layerId
                    ? { ...layer, [property]: value }
                    : layer
            );

            const updatedLogo = { ...prevLogo, layers: updatedLayers };
            onUpdate(updatedLogo);
            return updatedLogo;
        });
    }, [onUpdate]);

    const reorderLayers = useCallback((draggedId: string, targetId: string) => {
        setLogo(prevLogo => {
            if (!prevLogo.layers) return prevLogo;

            const newLayers = [...prevLogo.layers];
            const draggedIndex = newLayers.findIndex(layer => layer.id === draggedId);
            const targetIndex = newLayers.findIndex(layer => layer.id === targetId);

            if (draggedIndex === -1 || targetIndex === -1) return prevLogo;

            // Remove dragged layer and insert at target position
            const [draggedLayer] = newLayers.splice(draggedIndex, 1);
            newLayers.splice(targetIndex, 0, draggedLayer);

            // Update order values based on new positions
            const updatedLayers = newLayers.map((layer, index) => ({
                ...layer,
                order: newLayers.length - index // Reverse order so top layer has highest z-index
            }));

            const updatedLogo = { ...prevLogo, layers: updatedLayers };
            onUpdate(updatedLogo);
            return updatedLogo;
        });
    }, [onUpdate]);

    const handleLayerDragStart = (e: React.DragEvent, layerId: string) => {
        setDraggedLayerId(layerId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', layerId);
    };

    const handleLayerDragOver = (e: React.DragEvent, layerId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverLayerId(layerId);
    };

    const handleLayerDrop = (e: React.DragEvent, targetLayerId: string) => {
        e.preventDefault();

        if (draggedLayerId && draggedLayerId !== targetLayerId) {
            reorderLayers(draggedLayerId, targetLayerId);
        }

        setDraggedLayerId(null);
        setDragOverLayerId(null);
    };

    const handleLayerDragEnd = () => {
        setDraggedLayerId(null);
        setDragOverLayerId(null);
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
            isEraser: false,
            borderWidth: 0, // Kein Border standardmäßig
            borderColor: '#000000', // Schwarzer Border
            opacity: 100 // Vollständig opaque
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

    const updateDot = useCallback((property: keyof DotElement, value: string | number | boolean) => {
        setLogo(prevLogo => {
            if (!prevLogo.selectedDotId) return prevLogo;

            const updatedDots = prevLogo.dots.map(dot =>
                dot.id === prevLogo.selectedDotId
                    ? { ...dot, [property]: value }
                    : dot
            );

            const updatedLogo = { ...prevLogo, dots: updatedDots };
            onUpdate(updatedLogo);
            return updatedLogo;
        });
    }, [onUpdate]);

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
            isEraser: false,
            borderWidth: 0, // Kein Border standardmäßig
            borderColor: '#000000', // Schwarzer Border
            borderRadius: 0 // Border Radius in px (0 = eckig, >0 = abgerundet)
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

    const updateLine = (property: keyof LineElement, value: string | number | boolean | VectorPoint[]) => {
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

    const updateVectorPoint = useCallback((pointIndex: number, property: keyof VectorPoint, value: number) => {
        setLogo(prevLogo => {
            if (!prevLogo.selectedLineId) return prevLogo;

            const updatedLines = prevLogo.lines.map(line =>
                line.id === prevLogo.selectedLineId
                    ? {
                        ...line,
                        vectorPoints: line.vectorPoints.map((point, index) =>
                            index === pointIndex ? { ...point, [property]: value } : point
                        )
                    }
                    : line
            );

            const updatedLogo = { ...prevLogo, lines: updatedLines };
            onUpdate(updatedLogo);
            return updatedLogo;
        });
    }, [onUpdate]);

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

    // Drag & Drop Funktionen
    const handleMouseDown = (e: React.MouseEvent, type: 'dot' | 'vector' | 'lineEnd' | 'layer', id: string, pointIndex?: number, endPoint?: 'start' | 'end') => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging({ type, id, pointIndex, endPoint });
    };

    // Global drag handling
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            // Find the logo preview container
            const previewContainer = document.querySelector('.logo-preview-container');
            if (!previewContainer) return;

            const rect = previewContainer.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;


            if (isDragging.type === 'dot') {
                updateDot('x', Math.max(0, Math.min(100, x)));
                updateDot('y', Math.max(0, Math.min(100, y)));
            } else if (isDragging.type === 'vector' && isDragging.pointIndex !== undefined) {
                updateVectorPoint(isDragging.pointIndex, 'x', Math.max(0, Math.min(100, x)));
                updateVectorPoint(isDragging.pointIndex, 'y', Math.max(0, Math.min(100, y)));
            } else if (isDragging.type === 'lineEnd' && isDragging.endPoint) {
                // Aktualisiere beide Koordinaten gleichzeitig um Race Conditions zu vermeiden
                setLogo(prevLogo => {
                    if (!prevLogo.selectedLineId) return prevLogo;

                    const updatedLines = prevLogo.lines.map(line =>
                        line.id === prevLogo.selectedLineId
                            ? {
                                ...line,
                                ...(isDragging.endPoint === 'start'
                                    ? {
                                        x1: Math.max(0, Math.min(100, x)),
                                        y1: Math.max(0, Math.min(100, y))
                                    }
                                    : {
                                        x2: Math.max(0, Math.min(100, x)),
                                        y2: Math.max(0, Math.min(100, y))
                                    }
                                )
                            }
                            : line
                    );

                    const updatedLogo = { ...prevLogo, lines: updatedLines };
                    onUpdate(updatedLogo);
                    return updatedLogo;
                });
            }
        };

        const handleGlobalMouseUp = () => {
            setIsDragging(null);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, updateDot, updateVectorPoint]);

    // Color palette functionality removed - now standalone page

    const handleCharacterPropertyChange = (property: keyof Character, value: string | number | boolean) => {
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
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl relative animate-fade-in-up max-h-[90vh] overflow-y-auto">
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
                        className="logo-preview-container p-8 rounded-lg mb-6 transition-colors duration-300 relative"
                        style={{
                            background: logo.bgGradient || logo.bgColor
                        }}
                    >
                        {/* Logo Layout Renderer */}
                        {/* Logo Layer */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                display: logo.layers?.find(l => l.type === 'logo')?.visible !== false ? 'block' : 'none',
                                zIndex: logo.layers?.find(l => l.type === 'logo')?.order || 1
                            }}
                        >
                        {(() => {
                            const textElement = (
                                <div
                                    className="break-words cursor-pointer relative"
                                    style={{
                                        fontFeatureSettings: getFontFeatureSettings(),
                                        fontFamily: `"${logo.fontName}", sans-serif`,
                                        fontSize: '3rem'
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
                            );

                            const iconElement = logo.useIcon ? (
                                <div
                                    className="text-5xl flex-shrink-0"
                                    style={{ color: logo.textColor }}
                                >
                                    {logo.iconSymbol}
                                </div>
                            ) : null;

                            const sloganElement = logo.slogan ? (
                                <div
                                    className="text-lg opacity-75 mt-1 text-center"
                                    style={{
                                        fontFamily: `"${logo.fontName}", sans-serif`,
                                        color: logo.textColor
                                    }}
                                >
                                    {logo.slogan}
                                </div>
                            ) : null;

                            // Layout Rendering basierend auf dem gewählten Prinzip
                            switch (logo.layout) {
                                case 'wordmark':
                                    return (
                                        <div className="text-center">
                                            {textElement}
                                            {sloganElement}
                                        </div>
                                    );

                                case 'lok': // Icon links, Text rechts
                                    return (
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                {iconElement}
                                                <div className="text-center">
                                                    {textElement}
                                                </div>
                                            </div>
                                            {sloganElement}
                                        </div>
                                    );

                                case 'schub': // Text links, Icon rechts
                                    return (
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="text-center">
                                                    {textElement}
                                                </div>
                                                {iconElement}
                                            </div>
                                            {sloganElement}
                                        </div>
                                    );

                                case 'star': // Icon oben, Text unten
                                    return (
                                        <div className="text-center">
                                            {iconElement}
                                            <div className="mt-1 text-center">
                                                {textElement}
                                                {sloganElement}
                                            </div>
                                        </div>
                                    );


                                default:
                                    return textElement;
                            }
                        })()}
                        </div>

                        {/* Dots Layer */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                display: logo.layers?.find(l => l.type === 'dots')?.visible !== false ? 'block' : 'none',
                                zIndex: logo.layers?.find(l => l.type === 'dots')?.order || 2
                            }}
                        >
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
                                    border: dot.isEraser
                                        ? `2px dashed ${dot.color}`
                                        : dot.borderWidth > 0
                                        ? `${dot.borderWidth}px solid ${dot.borderColor}`
                                        : 'none',
                                    borderRadius: `${dot.borderRadius}%`,
                                    mixBlendMode: dot.isEraser ? 'difference' : 'normal',
                                    transform: `translate(-50%, -50%) rotate(${dot.rotation}deg)`,
                                    cursor: isDragging?.type === 'dot' && isDragging.id === dot.id ? 'grabbing' : 'grab',
                                    opacity: dot.opacity / 100
                                }}
                                onClick={() => handleDotClick(dot.id)}
                                onMouseDown={(e) => handleMouseDown(e, 'dot', dot.id)}
                            />
                        ))}
                        </div>

                        {/* Lines Layer */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                display: logo.layers?.find(l => l.type === 'lines')?.visible !== false ? 'block' : 'none',
                                zIndex: logo.layers?.find(l => l.type === 'lines')?.order || 3
                            }}
                        >
                        {/* Linien */}
                        {logo.lines.map((line) => (
                            <svg
                                key={line.id}
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                style={{ zIndex: 1 }}
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                            >
                                {/* SVG Filter für Border Radius */}
                                {line.borderRadius > 0 && (
                                    <defs>
                                        <filter id={`blur-${line.id}`} x="-50%" y="-50%" width="200%" height="200%">
                                            <feMorphology operator="dilate" radius={line.borderRadius / 20} result="thick"/>
                                            <feGaussianBlur in="thick" stdDeviation={line.borderRadius / 10} result="blurred"/>
                                            <feFlood floodColor={line.color} result="color"/>
                                            <feComposite in="color" in2="blurred" operator="in" result="comp"/>
                                        </filter>
                                    </defs>
                                )}

                                {/* Border/Outline der Linie */}
                                {line.borderWidth > 0 && !line.isEraser && (
                                    <path
                                        d={createSVGPath(line)}
                                        stroke={line.borderColor}
                                        strokeWidth={line.width + (line.borderWidth * 2)}
                                        strokeLinecap={line.borderRadius > 5 ? "round" : "butt"}
                                        strokeLinejoin={line.borderRadius > 5 ? "round" : "miter"}
                                        fill="none"
                                        className="pointer-events-none"
                                    />
                                )}
                                {/* Hauptlinie */}
                                <path
                                    d={createSVGPath(line)}
                                    stroke={line.color}
                                    strokeWidth={line.width}
                                    strokeDasharray={line.isEraser ? '5,5' : 'none'}
                                    strokeLinecap={line.borderRadius > 5 ? "round" : "butt"}
                                    strokeLinejoin={line.borderRadius > 5 ? "round" : "miter"}
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
                                {/* Vektorpunkte - nur diese bleiben im SVG */}
                                {logo.selectedLineId === line.id && line.vectorPoints.map((point, index) => (
                                    <circle
                                        key={index}
                                        cx={point.x}
                                        cy={point.y}
                                        r="4"
                                        fill="orange"
                                        stroke="white"
                                        strokeWidth="1"
                                        className="pointer-events-auto cursor-grab hover:scale-105 transition-transform origin-center"
                                        style={{
                                            cursor: isDragging?.type === 'vector' && isDragging.id === line.id && isDragging.pointIndex === index ? 'grabbing' : 'grab'
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, 'vector', line.id, index)}
                                    />
                                ))}
                            </svg>
                        ))}

                        {/* Linien-Endpunkt-Handles (außerhalb SVG für besseres Dragging) */}
                        {logo.lines.map((line) => (
                            logo.selectedLineId === line.id && (
                                <React.Fragment key={`handles-${line.id}`}>
                                    {/* Start-Handle */}
                                    <div
                                        className="absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full cursor-grab hover:scale-110 transition-transform z-10 pointer-events-auto"
                                        style={{
                                            left: `${line.x1}%`,
                                            top: `${line.y1}%`,
                                            transform: 'translate(-50%, -50%)',
                                            cursor: isDragging?.type === 'lineEnd' && isDragging.id === line.id && isDragging.endPoint === 'start' ? 'grabbing' : 'grab'
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, 'lineEnd', line.id, undefined, 'start')}
                                    />
                                    {/* End-Handle */}
                                    <div
                                        className="absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full cursor-grab hover:scale-110 transition-transform z-10 pointer-events-auto"
                                        style={{
                                            left: `${line.x2}%`,
                                            top: `${line.y2}%`,
                                            transform: 'translate(-50%, -50%)',
                                            cursor: isDragging?.type === 'lineEnd' && isDragging.id === line.id && isDragging.endPoint === 'end' ? 'grabbing' : 'grab'
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, 'lineEnd', line.id, undefined, 'end')}
                                    />
                                </React.Fragment>
                            )
                        ))}
                        </div>
                    </div>

                    {/* Punkt- und Linien-Tools */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-200">Tools</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={addDot}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors font-medium"
                                >
                                    + Punkt
                                </button>
                                <button
                                    onClick={addLine}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors font-medium"
                                >
                                    + Linie
                                </button>
                            </div>
                        </div>

                        {logo.selectedDotId && (
                            <div className="space-y-3 bg-gray-700 rounded-lg p-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-gray-200">Punkt bearbeiten</h4>
                                    <div className="flex gap-2">
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

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Farbe */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Farbe</label>
                                        <div className="flex items-center bg-gray-600 rounded px-2 py-1">
                                            <input
                                                type="color"
                                                value={logo.dots.find(d => d.id === logo.selectedDotId)?.color || '#FFFFFF'}
                                                onChange={(e) => updateDot('color', e.target.value)}
                                                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    {/* Dicke/Größe */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Größe ({logo.dots.find(d => d.id === logo.selectedDotId)?.size}px)
                                        </label>
                                        <input
                                            type="range"
                                            min="2"
                                            max="30"
                                            value={logo.dots.find(d => d.id === logo.selectedDotId)?.size || 8}
                                            onChange={(e) => updateDot('size', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Border Farbe */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Border Farbe</label>
                                        <div className="flex items-center bg-gray-600 rounded px-2 py-1">
                                            <input
                                                type="color"
                                                value={logo.dots.find(d => d.id === logo.selectedDotId)?.borderColor || '#000000'}
                                                onChange={(e) => updateDot('borderColor', e.target.value)}
                                                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    {/* Border Dicke */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Border Dicke ({logo.dots.find(d => d.id === logo.selectedDotId)?.borderWidth}px)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5"
                                            value={logo.dots.find(d => d.id === logo.selectedDotId)?.borderWidth || 0}
                                            onChange={(e) => updateDot('borderWidth', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* Form */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Form ({logo.dots.find(d => d.id === logo.selectedDotId)?.borderRadius}%)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={logo.dots.find(d => d.id === logo.selectedDotId)?.borderRadius || 100}
                                            onChange={(e) => updateDot('borderRadius', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    {/* Rotation */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Rotation ({logo.dots.find(d => d.id === logo.selectedDotId)?.rotation}°)
                                        </label>
                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            step="5"
                                            value={logo.dots.find(d => d.id === logo.selectedDotId)?.rotation || 0}
                                            onChange={(e) => updateDot('rotation', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    {/* Transparenz */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Transparenz ({logo.dots.find(d => d.id === logo.selectedDotId)?.opacity}%)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={logo.dots.find(d => d.id === logo.selectedDotId)?.opacity || 100}
                                            onChange={(e) => updateDot('opacity', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {logo.selectedLineId && (
                            <div className="space-y-3 bg-gray-700 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-gray-200">Linie bearbeiten</h4>
                                    <div className="flex gap-2">
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

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Farbe */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Farbe</label>
                                        <div className="flex items-center bg-gray-600 rounded px-2 py-1">
                                            <input
                                                type="color"
                                                value={logo.lines.find(l => l.id === logo.selectedLineId)?.color || '#FFFFFF'}
                                                onChange={(e) => updateLine('color', e.target.value)}
                                                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    {/* Dicke */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Dicke ({logo.lines.find(l => l.id === logo.selectedLineId)?.width}px)
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={logo.lines.find(l => l.id === logo.selectedLineId)?.width || 2}
                                            onChange={(e) => updateLine('width', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* Border Farbe */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Border Farbe</label>
                                        <div className="flex items-center bg-gray-600 rounded px-2 py-1">
                                            <input
                                                type="color"
                                                value={logo.lines.find(l => l.id === logo.selectedLineId)?.borderColor || '#000000'}
                                                onChange={(e) => updateLine('borderColor', e.target.value)}
                                                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    {/* Border Dicke */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Border Dicke ({logo.lines.find(l => l.id === logo.selectedLineId)?.borderWidth}px)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5"
                                            value={logo.lines.find(l => l.id === logo.selectedLineId)?.borderWidth || 0}
                                            onChange={(e) => updateLine('borderWidth', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    {/* Border Radius */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Border Radius ({logo.lines.find(l => l.id === logo.selectedLineId)?.borderRadius}px)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="20"
                                            step="1"
                                            value={logo.lines.find(l => l.id === logo.selectedLineId)?.borderRadius || 0}
                                            onChange={(e) => updateLine('borderRadius', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            X1 ({logo.lines.find(l => l.id === logo.selectedLineId)?.x1}%)
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
                                            Y1 ({logo.lines.find(l => l.id === logo.selectedLineId)?.y1}%)
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
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            X2 ({logo.lines.find(l => l.id === logo.selectedLineId)?.x2}%)
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
                                            Y2 ({logo.lines.find(l => l.id === logo.selectedLineId)?.y2}%)
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

                                {/* Kurven-Punkte */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs text-gray-400">
                                            Kurven ({logo.lines.find(l => l.id === logo.selectedLineId)?.vectorPoints.length || 0})
                                        </label>
                                        <button
                                            onClick={addVectorPoint}
                                            className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                                        >
                                            + Punkt
                                        </button>
                                    </div>

                                    {logo.lines.find(l => l.id === logo.selectedLineId)?.vectorPoints.map((point, index) => (
                                        <div key={index} className="bg-gray-600 rounded p-2 mb-2 flex items-center gap-2">
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={point.x}
                                                    onChange={(e) => updateVectorPoint(index, 'x', parseInt(e.target.value))}
                                                    className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer"
                                                    title={`X: ${point.x.toFixed(1)}%`}
                                                />
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={point.y}
                                                    onChange={(e) => updateVectorPoint(index, 'y', parseInt(e.target.value))}
                                                    className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer"
                                                    title={`Y: ${point.y.toFixed(1)}%`}
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeVectorPoint(index)}
                                                className="text-red-400 hover:text-red-300 text-xs px-1"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )) || null}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logo-Layout Einstellungen */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Logo-Layout</h3>

                        {/* Slogan Input */}
                        <div className="mb-4">
                            <label htmlFor="slogan" className="block text-sm font-medium text-gray-300 mb-2">
                                Slogan / Claim
                            </label>
                            <input
                                id="slogan"
                                type="text"
                                value={logo.slogan}
                                onChange={(e) => {
                                    const updatedLogo = { ...logo, slogan: e.target.value };
                                    setLogo(updatedLogo);
                                    onUpdate(updatedLogo);
                                }}
                                placeholder="z.B. 'Innovation für die Zukunft'"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Icon Toggle */}
                        <div className="mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={logo.useIcon}
                                    onChange={(e) => {
                                        const updatedLogo = { ...logo, useIcon: e.target.checked };
                                        setLogo(updatedLogo);
                                        onUpdate(updatedLogo);
                                    }}
                                    className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-300">Icon verwenden</span>
                            </label>
                        </div>

                        {/* Icon Auswahl - nur wenn Icon aktiviert */}
                        {logo.useIcon && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Icon Symbol
                                </label>
                                <div className="grid grid-cols-8 gap-2">
                                    {['⭐', '🚀', '💎', '🎯', '🔥', '💡', '🏆', '🎨', '🌟', '⚡', '🎪', '🎭', '🎪', '🔮', '🎨', '🌈'].map((symbol) => (
                                        <button
                                            key={symbol}
                                            onClick={() => {
                                                const updatedLogo = { ...logo, iconSymbol: symbol };
                                                setLogo(updatedLogo);
                                                onUpdate(updatedLogo);
                                            }}
                                            className={`p-2 text-2xl rounded-lg transition-colors ${
                                                logo.iconSymbol === symbol
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                        >
                                            {symbol}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Layout-Auswahl */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Layout-Prinzip
                            </label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                <button
                                    onClick={() => {
                                        const updatedLogo = { ...logo, layout: 'wordmark' as const };
                                        setLogo(updatedLogo);
                                        onUpdate(updatedLogo);
                                    }}
                                    className={`p-3 text-xs font-medium rounded-lg transition-colors ${
                                        logo.layout === 'wordmark'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Wortmarke
                                    <div className="text-xs opacity-75 mt-1">Nur Text</div>
                                </button>
                                <button
                                    onClick={() => {
                                        const updatedLogo = { ...logo, layout: 'lok' as const };
                                        setLogo(updatedLogo);
                                        onUpdate(updatedLogo);
                                    }}
                                    className={`p-3 text-xs font-medium rounded-lg transition-colors ${
                                        logo.layout === 'lok'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                    disabled={!logo.useIcon}
                                >
                                    Lok-Prinzip
                                    <div className="text-xs opacity-75 mt-1">Icon → Text</div>
                                </button>
                                <button
                                    onClick={() => {
                                        const updatedLogo = { ...logo, layout: 'schub' as const };
                                        setLogo(updatedLogo);
                                        onUpdate(updatedLogo);
                                    }}
                                    className={`p-3 text-xs font-medium rounded-lg transition-colors ${
                                        logo.layout === 'schub'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                    disabled={!logo.useIcon}
                                >
                                    Schub-Prinzip
                                    <div className="text-xs opacity-75 mt-1">Text → Icon</div>
                                </button>
                                <button
                                    onClick={() => {
                                        const updatedLogo = { ...logo, layout: 'star' as const };
                                        setLogo(updatedLogo);
                                        onUpdate(updatedLogo);
                                    }}
                                    className={`p-3 text-xs font-medium rounded-lg transition-colors ${
                                        logo.layout === 'star'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                    disabled={!logo.useIcon}
                                >
                                    Star-Prinzip
                                    <div className="text-xs opacity-75 mt-1">Icon ↑ Text</div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Ebenen-System */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Ebenen</h3>

                        <div className="space-y-2">
                            {logo.layers?.length ? logo.layers
                                .sort((a, b) => b.order - a.order) // Sort by order (highest first = topmost layer)
                                .map((layer, index) => (
                                <div
                                    key={layer.id}
                                    draggable={true}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                        logo.selectedLayerId === layer.id
                                            ? 'bg-blue-600'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    } ${
                                        draggedLayerId === layer.id
                                            ? 'opacity-50 scale-95'
                                            : ''
                                    } ${
                                        dragOverLayerId === layer.id && draggedLayerId !== layer.id
                                            ? 'border-t-2 border-blue-400'
                                            : ''
                                    }`}
                                    onClick={() => handleLayerClick(layer.id)}
                                    onDragStart={(e) => handleLayerDragStart(e, layer.id)}
                                    onDragOver={(e) => handleLayerDragOver(e, layer.id)}
                                    onDrop={(e) => handleLayerDrop(e, layer.id)}
                                    onDragEnd={handleLayerDragEnd}
                                >
                                    {/* Drag Handle */}
                                    <div className="text-gray-400 cursor-move">
                                        ⋮⋮
                                    </div>

                                    {/* Layer Icon */}
                                    <div className="text-xl">
                                        {layer.type === 'logo' && '📝'}
                                        {layer.type === 'dots' && '⚫'}
                                        {layer.type === 'lines' && '📏'}
                                    </div>

                                    {/* Layer Name */}
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-200">
                                            {layer.name}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Z-Index: {layer.order}
                                        </div>
                                    </div>

                                    {/* Visibility Toggle */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateLayer(layer.id, 'visible', !layer.visible);
                                        }}
                                        className={`text-sm px-2 py-1 rounded transition-colors ${
                                            layer.visible
                                                ? 'text-green-400 hover:text-green-300'
                                                : 'text-gray-500 hover:text-gray-400'
                                        }`}
                                    >
                                        {layer.visible ? '👁️' : '🙈'}
                                    </button>

                                    {/* Lock Toggle */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateLayer(layer.id, 'locked', !layer.locked);
                                        }}
                                        className={`text-sm px-2 py-1 rounded transition-colors ${
                                            layer.locked
                                                ? 'text-red-400 hover:text-red-300'
                                                : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                    >
                                        {layer.locked ? '🔒' : '🔓'}
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center text-gray-400 text-sm py-4">
                                    Ebenen werden geladen...
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Punkt- und Linien-Tools */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-200">Tools</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={addDot}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors font-medium"
                                >
                                    + Punkt
                                </button>
                                <button
                                    onClick={addLine}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors font-medium"
                                >
                                    + Linie
                                </button>
                            </div>
                        </div>

                        {logo.selectedDotId && (
                            <div className="space-y-3 bg-gray-700 rounded-lg p-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-gray-200">Punkt bearbeiten</h4>
                                    <div className="flex gap-2">
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

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Farbe */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Farbe</label>
                                        <div className="flex items-center bg-gray-600 rounded px-2 py-1">
                                            <input
                                                type="color"
                                                value={logo.dots.find(d => d.id === logo.selectedDotId)?.color || '#FFFFFF'}
                                                onChange={(e) => updateDot('color', e.target.value)}
                                                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    {/* Dicke/Größe */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Größe ({logo.dots.find(d => d.id === logo.selectedDotId)?.size}px)
                                        </label>
                                        <input
                                            type="range"
                                            min="2"
                                            max="30"
                                            value={logo.dots.find(d => d.id === logo.selectedDotId)?.size || 8}
                                            onChange={(e) => updateDot('size', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Border Farbe */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Border Farbe</label>
                                        <div className="flex items-center bg-gray-600 rounded px-2 py-1">
                                            <input
                                                type="color"
                                                value={logo.dots.find(d => d.id === logo.selectedDotId)?.borderColor || '#000000'}
                                                onChange={(e) => updateDot('borderColor', e.target.value)}
                                                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    {/* Border Dicke */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Border Dicke ({logo.dots.find(d => d.id === logo.selectedDotId)?.borderWidth}px)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5"
                                            value={logo.dots.find(d => d.id === logo.selectedDotId)?.borderWidth || 0}
                                            onChange={(e) => updateDot('borderWidth', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* Form */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Form ({logo.dots.find(d => d.id === logo.selectedDotId)?.borderRadius}%)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={logo.dots.find(d => d.id === logo.selectedDotId)?.borderRadius || 100}
                                            onChange={(e) => updateDot('borderRadius', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    {/* Rotation */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Rotation ({logo.dots.find(d => d.id === logo.selectedDotId)?.rotation}°)
                                        </label>
                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            step="5"
                                            value={logo.dots.find(d => d.id === logo.selectedDotId)?.rotation || 0}
                                            onChange={(e) => updateDot('rotation', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    {/* Transparenz */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Transparenz ({logo.dots.find(d => d.id === logo.selectedDotId)?.opacity}%)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={logo.dots.find(d => d.id === logo.selectedDotId)?.opacity || 100}
                                            onChange={(e) => updateDot('opacity', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {logo.selectedLineId && (
                            <div className="space-y-3 bg-gray-700 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-gray-200">Linie bearbeiten</h4>
                                    <div className="flex gap-2">
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

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Farbe */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Farbe</label>
                                        <div className="flex items-center bg-gray-600 rounded px-2 py-1">
                                            <input
                                                type="color"
                                                value={logo.lines.find(l => l.id === logo.selectedLineId)?.color || '#FFFFFF'}
                                                onChange={(e) => updateLine('color', e.target.value)}
                                                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    {/* Dicke */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Dicke ({logo.lines.find(l => l.id === logo.selectedLineId)?.width}px)
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={logo.lines.find(l => l.id === logo.selectedLineId)?.width || 2}
                                            onChange={(e) => updateLine('width', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* Border Farbe */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">Border Farbe</label>
                                        <div className="flex items-center bg-gray-600 rounded px-2 py-1">
                                            <input
                                                type="color"
                                                value={logo.lines.find(l => l.id === logo.selectedLineId)?.borderColor || '#000000'}
                                                onChange={(e) => updateLine('borderColor', e.target.value)}
                                                className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    {/* Border Dicke */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Border Dicke ({logo.lines.find(l => l.id === logo.selectedLineId)?.borderWidth}px)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5"
                                            value={logo.lines.find(l => l.id === logo.selectedLineId)?.borderWidth || 0}
                                            onChange={(e) => updateLine('borderWidth', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    {/* Border Radius */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-2">
                                            Border Radius ({logo.lines.find(l => l.id === logo.selectedLineId)?.borderRadius}px)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="20"
                                            step="1"
                                            value={logo.lines.find(l => l.id === logo.selectedLineId)?.borderRadius || 0}
                                            onChange={(e) => updateLine('borderRadius', parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            X1 ({logo.lines.find(l => l.id === logo.selectedLineId)?.x1}%)
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
                                            Y1 ({logo.lines.find(l => l.id === logo.selectedLineId)?.y1}%)
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
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">
                                            X2 ({logo.lines.find(l => l.id === logo.selectedLineId)?.x2}%)
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
                                            Y2 ({logo.lines.find(l => l.id === logo.selectedLineId)?.y2}%)
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

                                {/* Kurven-Punkte */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs text-gray-400">
                                            Kurven ({logo.lines.find(l => l.id === logo.selectedLineId)?.vectorPoints.length || 0})
                                        </label>
                                        <button
                                            onClick={addVectorPoint}
                                            className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                                        >
                                            + Punkt
                                        </button>
                                    </div>

                                    {logo.lines.find(l => l.id === logo.selectedLineId)?.vectorPoints.map((point, index) => (
                                        <div key={index} className="bg-gray-600 rounded p-2 mb-2 flex items-center gap-2">
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={point.x}
                                                    onChange={(e) => updateVectorPoint(index, 'x', parseInt(e.target.value))}
                                                    className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer"
                                                    title={`X: ${point.x.toFixed(1)}%`}
                                                />
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={point.y}
                                                    onChange={(e) => updateVectorPoint(index, 'y', parseInt(e.target.value))}
                                                    className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer"
                                                    title={`Y: ${point.y.toFixed(1)}%`}
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeVectorPoint(index)}
                                                className="text-red-400 hover:text-red-300 text-xs px-1"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )) || null}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Zeichen-Einstellungen */}
                    {logo.selectedCharIndex !== null && (
                        <div className="bg-gray-800 rounded-lg p-4 mb-6">
                            <h3 className="text-lg font-semibold text-gray-200 mb-4">
                                Buchstaben bearbeiten: &quot;{logo.characters[logo.selectedCharIndex].char}&quot;
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Farbe */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Farbe
                                    </label>
                                    <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2">
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
                            </div>

                            {/* Glyph-Auswahl */}
                            <div className="mt-4">
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
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center bg-gray-700 rounded-lg px-3 flex-1">
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
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Hintergrund
                                    </label>
                                    <div className="space-y-2">
                                        {/* Solid Color */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-gray-700 rounded-lg px-3 flex-1">
                                                <input
                                                    type="color"
                                                    value={logo.bgColor}
                                                    onChange={(e) => {
                                                        const updatedLogo = { ...logo, bgColor: e.target.value, bgGradient: null };
                                                        setLogo(updatedLogo);
                                                        onUpdate(updatedLogo);
                                                    }}
                                                    className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                                                />
                                                <span className="pl-3 font-mono text-sm">{logo.bgColor}</span>
                                            </div>
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

                        </div>

                        {/* Font Features */}
                        <div className="space-y-4">

                            {/* Font Features */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-200 mb-3">
                                    Font Features ({logo.fontName})
                                </h3>
                                <div className="space-y-2">
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
    const [slogan, setSlogan] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<string>('');
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
    const getDefaultFontFeatures = (): FontFeature[] => {
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
    const generateInitialLogos = useCallback(async (currentText: string, currentSlogan: string = '', currentIcon: string = '') => {
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
                id: `${fontName}-${currentText}-${currentSlogan}-${currentIcon}`,
                text: currentText,
                fontName,
                textColor: defaultColor,
                bgColor: '#1F2937',
                bgGradient: null,
                characters: createCharactersFromText(currentText, defaultColor),
                fontFeatures: getDefaultFontFeatures(),
                selectedCharIndex: null,
                dots: [],
                selectedDotId: null,
                lines: [],
                selectedLineId: null,
                // Neue Logo-Layout Features
                slogan: currentSlogan,
                useIcon: currentIcon !== '',
                layout: currentIcon ? 'lok' : 'wordmark',
                iconSymbol: currentIcon || '⭐'
            });
        }
        setLogos(generated);
        setIsLoading(false);
    }, [getFontData]);

    // Effekt, der bei Textänderung die Logos neu generiert (mit Debounce)
    useEffect(() => {
        const handler = setTimeout(() => {
            generateInitialLogos(text, slogan, selectedIcon);
        }, 500);
        return () => clearTimeout(handler);
    }, [text, slogan, selectedIcon, generateInitialLogos]);

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

                {/* Navigation to Color Palette Page */}
                <div className="mt-6">
                    <Link
                        href="/colors"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                    >
                        <Palette size={20} />
                        Farbpaletten anzeigen
                    </Link>
                </div>
            </header>

            <main>
                <div className="max-w-2xl mx-auto mb-10 space-y-6">
                    {/* Markenname */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                            Markenname
                        </label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Markenname hier eingeben..."
                            className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-lg text-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Slogan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                            Slogan (Optional)
                        </label>
                        <input
                            type="text"
                            value={slogan}
                            onChange={(e) => setSlogan(e.target.value)}
                            placeholder="z.B. Innovation für alle"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Icon Auswahl */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                            Icon auswählen (Optional)
                        </label>
                        <div className="grid grid-cols-6 gap-3">
                            {/* Keine Icon Option */}
                            <button
                                onClick={() => setSelectedIcon('')}
                                className={`aspect-square border-2 rounded-lg p-3 text-2xl transition-all ${
                                    selectedIcon === ''
                                        ? 'border-indigo-500 bg-indigo-500/20'
                                        : 'border-gray-600 hover:border-gray-500'
                                }`}
                                title="Kein Icon"
                            >
                                ✕
                            </button>
                            {/* Icon Optionen */}
                            {['⭐', '🚀', '💡', '🎯', '🏆', '💎', '🔥', '⚡', '🌟', '🔮', '🎨', '🎪', '🎭', '🎯', '🎸'].map((icon, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedIcon(icon)}
                                    className={`aspect-square border-2 rounded-lg p-3 text-2xl transition-all ${
                                        selectedIcon === icon
                                            ? 'border-indigo-500 bg-indigo-500/20'
                                            : 'border-gray-600 hover:border-gray-500'
                                    }`}
                                    title={`Icon: ${icon}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
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
                        border: dot.isEraser
                            ? `1px dashed ${dot.color}`
                            : dot.borderWidth > 0
                            ? `${dot.borderWidth}px solid ${dot.borderColor}`
                            : 'none',
                        borderRadius: `${dot.borderRadius}%`,
                        mixBlendMode: dot.isEraser ? 'difference' : 'normal',
                        transform: `translate(-50%, -50%) rotate(${dot.rotation}deg)`,
                        opacity: dot.opacity / 100
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
                    {/* Border/Outline der Linie */}
                    {line.borderWidth > 0 && !line.isEraser && (
                        <path
                            d={createSVGPath(line)}
                            stroke={line.borderColor}
                            strokeWidth={line.width + (line.borderWidth * 2)}
                            strokeLinecap={line.borderRadius > 5 ? "round" : "butt"}
                            strokeLinejoin={line.borderRadius > 5 ? "round" : "miter"}
                            fill="none"
                        />
                    )}
                    {/* Hauptlinie */}
                    <path
                        d={createSVGPath(line)}
                        stroke={line.color}
                        strokeWidth={line.width}
                        strokeDasharray={line.isEraser ? '3,3' : 'none'}
                        strokeLinecap={line.borderRadius > 5 ? "round" : "butt"}
                        strokeLinejoin={line.borderRadius > 5 ? "round" : "miter"}
                        opacity={line.isEraser ? 0.7 : 1}
                        fill="none"
                        style={{
                            mixBlendMode: line.isEraser ? 'difference' : 'normal'
                        }}
                    />
                </svg>
            ))}

            <p className="text-center text-xs text-gray-400 mt-4 opacity-70">{logo.fontName}</p>
        </div>
    );
}
