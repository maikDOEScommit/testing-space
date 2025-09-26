"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Loader2 } from "lucide-react";

const ALL_FEATURES_TO_CHECK = [
  "liga",
  "clig",
  "dlig",
  ...Array.from(
    { length: 20 },
    (_, i) => `ss${String(i + 1).padStart(2, "0")}`
  ),
  "swsh",
  "salt",
];

export default function LogoEditor({
  logo,
  fontDataPromise,
  onClose,
  onUpdate,
}) {
  const [localLogo, setLocalLogo] = useState(logo);
  const [fontData, setFontData] = useState(null);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
  const [potentialLigatures, setPotentialLigatures] = useState(new Set());

  // Effekt zum Laden der Font-Analyse-Daten
  useEffect(() => {
    fontDataPromise.then((data) => {
      if (data) {
        setFontData(data);
        // Hier Logik für Ligatur-Erkennung etc.
      }
    });
  }, [fontDataPromise]);

  // Effekt, um den internen State zu aktualisieren, wenn sich die `logo` prop ändert
  useEffect(() => {
    setLocalLogo(logo);
  }, [logo]);

  const handleLocalUpdate = (updatedData) => {
    const newLogo = { ...localLogo, ...updatedData };
    setLocalLogo(newLogo);
    onUpdate(newLogo);
  };

  const renderPreview = () => {
    // Diese Funktion muss noch implementiert werden, um Glyphen/Ligaturen darzustellen
    const fontClassName = FONT_CONFIG[localLogo.fontName].className;
    const style = {
      fontFeatureSettings: Object.entries(localLogo.globalFeatures)
        .filter(([, v]) => v)
        .map(([k]) => `'${k}' on`)
        .join(", "),
      color: localLogo.textColor,
    };
    return (
      <div className={fontClassName} style={style}>
        {localLogo.text}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Logo anpassen</h2>
          <div
            className="p-10 mb-6 rounded-lg"
            style={{ backgroundColor: localLogo.bgColor }}
          >
            <div className="text-6xl text-center">
              {fontData ? (
                renderPreview()
              ) : (
                <Loader2 className="mx-auto animate-spin" />
              )}
            </div>
          </div>
          {/* HIER KÄMEN DIE STEUERUNGSELEMENTE HIN */}
          <div className="text-center text-gray-500">
            <p>
              Steuerungselemente für Glyphen, Features und Farben kommen hier
              hin.
            </p>
            <p className="text-sm mt-2">(Implementierung ausstehend)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dummy FONT_CONFIG, damit die Komponente nicht crasht
const FONT_CONFIG = {
  Aboro: { className: "font-aboro" },
  Abind: { className: "font-abind" },
  Abang: { className: "font-abang" },
};
