"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type ColorPalette = {
    id: string;
    name: string;
    colors: string[];
    category: string;
};

type Category = {
    id: string;
    name: string;
    description: string;
    icon: string;
};

const CATEGORIES: Category[] = [
    { id: 'professional', name: 'Professional', description: 'Business & Corporate', icon: '💼' },
    { id: 'creative', name: 'Creative', description: 'Art & Design', icon: '🎨' },
    { id: 'tech', name: 'Technology', description: 'Modern & Digital', icon: '💻' },
    { id: 'nature', name: 'Nature', description: 'Organic & Earth Tones', icon: '🌿' },
    { id: 'vibrant', name: 'Vibrant', description: 'Bold & Energetic', icon: '🌈' },
    { id: 'minimal', name: 'Minimal', description: 'Clean & Simple', icon: '⚪' },
    { id: 'luxury', name: 'Luxury', description: 'Premium & Elegant', icon: '✨' },
    { id: 'retro', name: 'Retro', description: 'Vintage & Classic', icon: '📼' }
];

// HSLA color harmony generators
const generateColorHarmony = (baseHue: number, harmony: string, saturation: number = 70, lightness: number = 50): string[] => {
    const colors: string[] = [];

    switch (harmony) {
        case 'triadic':
            // 120° apart
            colors.push(
                `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
                `hsl(${(baseHue + 120) % 360}, ${saturation}%, ${lightness}%)`,
                `hsl(${(baseHue + 240) % 360}, ${saturation}%, ${lightness}%)`
            );
            break;
        case 'complementary':
            // 180° apart
            colors.push(
                `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
                `hsl(${(baseHue + 180) % 360}, ${saturation}%, ${lightness}%)`,
                `hsl(${baseHue}, ${saturation * 0.5}%, ${lightness + 20}%)`
            );
            break;
        case 'analogous':
            // 30° apart
            colors.push(
                `hsl(${(baseHue - 30 + 360) % 360}, ${saturation}%, ${lightness}%)`,
                `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
                `hsl(${(baseHue + 30) % 360}, ${saturation}%, ${lightness}%)`
            );
            break;
        case 'split-complementary':
            // Base + 150° and 210°
            colors.push(
                `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
                `hsl(${(baseHue + 150) % 360}, ${saturation}%, ${lightness}%)`,
                `hsl(${(baseHue + 210) % 360}, ${saturation}%, ${lightness}%)`
            );
            break;
        case 'tetradic':
            // Square harmony - 90° apart, but we only show first 3
            colors.push(
                `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
                `hsl(${(baseHue + 90) % 360}, ${saturation}%, ${lightness}%)`,
                `hsl(${(baseHue + 180) % 360}, ${saturation}%, ${lightness}%)`
            );
            break;
        case 'monochromatic':
            // Same hue, different saturation/lightness
            colors.push(
                `hsl(${baseHue}, ${saturation}%, ${lightness - 20}%)`,
                `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
                `hsl(${baseHue}, ${saturation}%, ${lightness + 20}%)`
            );
            break;
        default:
            colors.push(
                `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
                `hsl(${(baseHue + 120) % 360}, ${saturation}%, ${lightness}%)`,
                `hsl(${(baseHue + 240) % 360}, ${saturation}%, ${lightness}%)`
            );
    }

    return colors;
};

const HARMONY_TYPES = ['triadic', 'complementary', 'analogous', 'split-complementary', 'tetradic', 'monochromatic'];

const generatePalettesForCategory = (category: string, offset: number, limit: number): ColorPalette[] => {
    const palettes: ColorPalette[] = [];

    // Different base settings per category
    const categorySettings = {
        professional: { saturationRange: [40, 60], lightnessRange: [35, 65] },
        creative: { saturationRange: [60, 90], lightnessRange: [40, 70] },
        tech: { saturationRange: [20, 80], lightnessRange: [25, 75] },
        nature: { saturationRange: [50, 80], lightnessRange: [30, 60] },
        vibrant: { saturationRange: [80, 100], lightnessRange: [45, 65] },
        minimal: { saturationRange: [0, 30], lightnessRange: [20, 80] },
        luxury: { saturationRange: [40, 70], lightnessRange: [25, 55] },
        retro: { saturationRange: [60, 85], lightnessRange: [40, 70] }
    };

    const settings = categorySettings[category as keyof typeof categorySettings] || categorySettings.professional;

    for (let i = 0; i < limit; i++) {
        const paletteIndex = offset + i;

        // Generate variety through different combinations
        const baseHue = (paletteIndex * 31) % 360; // Use prime number for better distribution
        const harmonyType = HARMONY_TYPES[paletteIndex % HARMONY_TYPES.length];
        const saturation = settings.saturationRange[0] + ((paletteIndex * 17) % (settings.saturationRange[1] - settings.saturationRange[0]));
        const lightness = settings.lightnessRange[0] + ((paletteIndex * 23) % (settings.lightnessRange[1] - settings.lightnessRange[0]));

        const colors = generateColorHarmony(baseHue, harmonyType, saturation, lightness);

        palettes.push({
            id: `${category}-${paletteIndex}-${harmonyType}`,
            name: `${category.charAt(0).toUpperCase() + category.slice(1)} ${harmonyType.charAt(0).toUpperCase() + harmonyType.slice(1)} ${paletteIndex + 1}`,
            colors,
            category
        });
    }

    return palettes;
};

const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
};

export default function ColorPalettePage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('professional');
    const [palettes, setPalettes] = useState<ColorPalette[]>([]);
    const [loading, setLoading] = useState(false);
    const offsetRef = useRef(0);
    const loadingRef = useRef<HTMLDivElement>(null);

    const loadPalettes = useCallback(async (categoryId: string, reset: boolean = false) => {
        setLoading(true);

        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for UX

        const currentOffset = reset ? 0 : offsetRef.current;
        const newPalettes = generatePalettesForCategory(categoryId, currentOffset, 12);

        if (reset) {
            setPalettes(newPalettes);
            offsetRef.current = 12;
        } else {
            setPalettes(prev => [...prev, ...newPalettes]);
            offsetRef.current = offsetRef.current + 12;
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        offsetRef.current = 0; // Reset offset when category changes
        loadPalettes(selectedCategory, true);
    }, [selectedCategory, loadPalettes]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading) {
                    loadPalettes(selectedCategory, false);
                }
            },
            { threshold: 0.1 }
        );

        if (loadingRef.current) {
            observer.observe(loadingRef.current);
        }

        return () => observer.disconnect();
    }, [loadPalettes, selectedCategory, loading]);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Color Palettes</h1>
                            <p className="text-gray-400 text-sm">Professional color palettes for logos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedCategory === category.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                <span className="mr-2">{category.icon}</span>
                                {category.name}
                            </button>
                        ))}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                        {CATEGORIES.find(c => c.id === selectedCategory)?.description}
                    </p>
                </div>
            </div>

            {/* Palettes Grid */}
            <div className="max-w-6xl mx-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {palettes.map((palette) => (
                        <div
                            key={palette.id}
                            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                        >
                            <h3 className="text-sm font-medium mb-3 text-gray-200">{palette.name}</h3>
                            <div className="flex rounded-lg overflow-hidden h-20 mb-3">
                                {palette.colors.map((color, index) => (
                                    <div
                                        key={index}
                                        className="flex-1 hover:scale-105 transition-transform cursor-pointer relative group"
                                        style={{ backgroundColor: color }}
                                        onClick={() => copyToClipboard(color)}
                                        title={`${color} - Click to copy`}
                                    >
                                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-1 text-xs text-gray-400">
                                {palette.colors.map((color, index) => (
                                    <span
                                        key={index}
                                        className="font-mono cursor-pointer hover:text-white transition-colors"
                                        onClick={() => copyToClipboard(color)}
                                    >
                                        {color}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Loading Indicator */}
                <div ref={loadingRef} className="text-center py-8">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-gray-400">Generating more palettes...</span>
                        </div>
                    ) : (
                        <span className="text-gray-500">Scroll for more palettes</span>
                    )}
                </div>
            </div>
        </div>
    );
}