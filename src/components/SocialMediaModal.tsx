import React, { useState } from 'react';
import { X, Share2, Check } from 'lucide-react';

interface SocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishSuccess: () => void;
}

export const SocialMediaModal: React.FC<SocialMediaModalProps> = ({
  isOpen,
  onClose,
  onPublishSuccess,
}) => {
  const [youtubeToken, setYoutubeToken] = useState('');
  const [tiktokKey, setTiktokKey] = useState('');
  const [twitterToken, setTwitterToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onPublishSuccess();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-amber-400" />
          <span>Vincular Redes Sociales</span>
        </h3>

        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Introduce tus datos para publicar el proyecto generado directamente en tus cuentas autorizadas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              YouTube Token / Channel ID
            </label>
            <input
              type="text"
              value={youtubeToken}
              onChange={(e) => setYoutubeToken(e.target.value)}
              placeholder="UC..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-white placeholder-slate-600 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              TikTok Developer Key
            </label>
            <input
              type="text"
              value={tiktokKey}
              onChange={(e) => setTiktokKey(e.target.value)}
              placeholder="aw..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-white placeholder-slate-600 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              X (Twitter) OAuth Token
            </label>
            <input
              type="text"
              value={twitterToken}
              onChange={(e) => setTwitterToken(e.target.value)}
              placeholder="oauth_token..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 text-white placeholder-slate-600 text-xs outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar y Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
