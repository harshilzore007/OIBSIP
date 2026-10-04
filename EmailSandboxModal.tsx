import React, { useState, useEffect } from 'react';
import { Mail, X, RefreshCw, ExternalLink, Trash2, Clock, Check } from 'lucide-react';
import { api } from '../api';
import { sound } from '../utils/audio';

interface EmailSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVerificationCode?: (code: string) => void;
  onApplyResetToken?: (token: string) => void;
}

export const EmailSandboxModal: React.FC<EmailSandboxModalProps> = ({
  isOpen,
  onClose,
  onApplyVerificationCode,
  onApplyResetToken,
}) => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await api.getSimulatedEmails();
      setEmails(res.emails);
      if (res.emails.length > 0 && !selectedEmail) {
        setSelectedEmail(res.emails[0]);
      }
    } catch (err) {
      console.error('Failed to fetch simulated emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="modal-email-sandbox"
        className="w-full max-w-3xl bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-stone-900">Simulated Email Outbox</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  SANDBOX
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Captures verification codes, password reset tokens & low-stock cron alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition"
              title="Refresh outbox"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left email list, right email viewer */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Email List (5 cols) */}
          <div className="md:col-span-5 border-r border-stone-200 overflow-y-auto bg-stone-50/70 p-3 space-y-2">
            {emails.length === 0 ? (
              <div className="p-6 text-center text-stone-500 text-xs">
                No emails dispatched yet. Register an account or trigger a stock threshold alert to see outgoing emails here!
              </div>
            ) : (
              emails.map((m) => {
                const isSelected = selectedEmail?.id === m.id;

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedEmail(m);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 shadow-xs'
                        : 'bg-white hover:bg-stone-100/80 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-stone-500 text-[10px] mb-1">
                      <span className="truncate max-w-[140px] font-medium text-stone-700">To: {m.to}</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className={`font-bold truncate ${isSelected ? 'text-amber-800' : 'text-stone-900'}`}>
                      {m.subject}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Email Reader View (7 cols) */}
          <div className="md:col-span-7 p-5 overflow-y-auto bg-white flex flex-col justify-between">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="border-b border-stone-200 pb-3">
                  <h4 className="font-serif text-lg font-bold text-stone-900">{selectedEmail.subject}</h4>
                  <div className="flex justify-between items-center text-xs text-stone-500 mt-1">
                    <span>
                      From: <strong className="text-stone-800">{selectedEmail.from}</strong>
                    </span>
                    <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    To: <strong className="text-amber-800">{selectedEmail.to}</strong>
                  </p>
                </div>

                {/* Email HTML / Text render */}
                <div
                  className="max-w-none text-xs text-stone-800 bg-stone-50 p-4 rounded-2xl border border-stone-200 font-sans leading-relaxed overflow-x-auto shadow-2xs"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html || `<pre class="whitespace-pre-wrap">${selectedEmail.text}</pre>` }}
                />

                {selectedEmail.previewUrl && (
                  <div className="pt-2">
                    <a
                      href={selectedEmail.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:underline"
                    >
                      <span>Open in Ethereal Mail Viewer</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-stone-400 text-xs">
                Select an email from the left sidebar to preview its contents.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
