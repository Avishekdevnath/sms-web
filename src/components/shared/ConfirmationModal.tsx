'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  requireTyping?: boolean;
  typingConfirmation?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  requireTyping = false,
  typingConfirmation = 'DELETE'
}: ConfirmationModalProps) {
  const [typingValue, setTypingValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Reset typing state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTypingValue('');
      setIsTyping(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (requireTyping && typingValue !== typingConfirmation) {
      setIsTyping(true);
      return;
    }
    
    onConfirm();
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          iconBg: 'bg-red-100'
        };
      case 'warning':
        return {
          icon: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          iconBg: 'bg-yellow-100'
        };
      case 'info':
        return {
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          iconBg: 'bg-blue-100'
        };
      default:
        return {
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          iconBg: 'bg-red-100'
        };
    }
  };

  const typeStyles = getTypeStyles();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-focus">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${typeStyles.iconBg}`}>
              <AlertTriangle className={`h-5 w-5 ${typeStyles.icon}`} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {requireTyping && (
            <div className="mb-6">
              <label htmlFor="typing-confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-mono font-bold text-red-600">{typingConfirmation}</span> to confirm:
              </label>
              <input
                type="text"
                id="typing-confirmation"
                value={typingValue}
                onChange={(e) => setTypingValue(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isTyping && typingValue !== typingConfirmation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={typingConfirmation}
              />
              {isTyping && typingValue !== typingConfirmation && (
                <p className="mt-1 text-sm text-red-600">
                  Please type exactly "{typingConfirmation}" to confirm
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={requireTyping && typingValue !== typingConfirmation}
              className={`px-4 py-2 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${typeStyles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 