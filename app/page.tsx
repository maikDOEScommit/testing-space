"use client"; // Wichtig! Markiert dies als Client-Komponente

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, X } from 'lucide-react';

// Font-Konfiguration
const FONT_CONFIG: Record<string, { woff2: string; className: string }> = {
    'Aboro': { woff2: '/fonts/Aboro.woff2', className: 'font-aboro' },
    'Abind': { woff2: '/fonts/Abind.woff2', className: 'font-abind' },
    'Abang': { woff2: '/fonts/Abang.woff2', className: 'font-abang' },
};

// Types definieren
type Logo = {
    id: string;
    text: string;
    fontName: string;
    textColor: string;
    bgColor: string;
    groups: Array<{
        text: string;
        type: string;
        start: number;
        activeFeature: null;
        color: null;
    }>;
    globalFeatures: {
        liga: boolean;
        clig: boolean;
    };
};

// --- LogoEditor Komponente (vorher in separater Datei) ---
function LogoEditor({ logo: initialLogo, onClose, onUpdate }: {
    logo: Logo;
    onClose: () => void;
    onUpdate: (logo: Logo) => void;
}) {
    const [logo, setLogo] = useState(initialLogo);
    const fontClassName = FONT_CONFIG[logo.fontName].className;

    useEffect(() => {
        setLogo(initialLogo);
    }, [initialLogo]);

    const handleColorChange = (type: string, value: string) => {
        const updatedLogo = { ...logo, [type]: value };
        setLogo(updatedLogo);
        onUpdate(updatedLogo); // Live-Vorschau auf der Hauptseite aktualisieren
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg relative animate-fade-in-up">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                    aria-label="Editor schließen"
                >
                    <X size={24} />
                </button>
                <div className="p-6">
                     <h2 className="text-2xl font-bold mb-6 text-center">Logo bearbeiten</h2>
                    {/* Vorschau-Bereich */}
                    <div
                        className="p-8 rounded-lg mb-6 transition-colors duration-300"
                        style={{ backgroundColor: logo.bgColor, color: logo.textColor }}
                    >
                        <div className={`${fontClassName} text-6xl text-center break-words features-on`}>
                            {logo.text}
                        </div>
                    </div>

                    {/* Steuerungs-Bereich */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="textColor" className="block text-sm font-medium text-gray-300 mb-2">
                                Textfarbe
                            </label>
                            <div className="flex items-center bg-gray-700 rounded-lg px-3">
                                <input
                                    id="textColor"
                                    type="color"
                                    value={logo.textColor}
                                    onChange={(e) => handleColorChange('textColor', e.target.value)}
                                    className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                                />
                                <span className="pl-3 font-mono">{logo.textColor}</span>
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
                                <span className="pl-3 font-mono">{logo.bgColor}</span>
                            </div>
                        </div>
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

    // Generiert die initialen Logo-Daten
    const generateInitialLogos = useCallback(async (currentText: string) => {
        if (!currentText) {
            setLogos([]);
            return;
        }
        setIsLoading(true);
        const generated = [];
        for (const fontName in FONT_CONFIG) {
            await getFontData(fontName); // Stellt sicher, dass die Schrift gecached ist
            generated.push({
                id: `${fontName}-${currentText}`,
                text: currentText,
                fontName,
                textColor: '#FFFFFF',
                bgColor: '#1F2937',
                // Zukünftige erweiterte Features
                groups: [{ text: currentText, type: 'full', start: 0, activeFeature: null, color: null }],
                globalFeatures: { 'liga': true, 'clig': true }
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
    const { fontName, textColor, bgColor, text } = logo;
    const fontClassName = FONT_CONFIG[fontName].className;

    return (
        <div
            onClick={onEdit}
            className="p-8 rounded-lg cursor-pointer transform hover:scale-105 transition-all duration-300"
            style={{ backgroundColor: bgColor, color: textColor }}
        >
            <div className={`${fontClassName} text-5xl text-center break-words features-on`}>
                {text}
            </div>
             <p className="text-center text-xs text-gray-400 mt-4 opacity-70">{fontName}</p>
        </div>
    );
}
