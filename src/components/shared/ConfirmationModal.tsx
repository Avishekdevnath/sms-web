'use client';

import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  requireTyping?: boolean;
  typingTarget?: string;
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
  isLoading = false,
  requireTyping = false,
  typingTarget = ''
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          border: 'border-yellow-200'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          border: 'border-blue-200'
        };
      default:
        return {
          icon: '⚠️',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          border: 'border-red-200'
        };
    }
  };

  const styles = getTypeStyles();
  const [typedText, setTypedText] = React.useState('');
  const [typingError, setTypingError] = React.useState('');

  const handleConfirm = () => {
    if (!isLoading) {
      if (requireTyping && typedText !== typingTarget) {
        setTypingError('Please type the exact name to confirm deletion');
        return;
      }
      if (requireTyping && !typingTarget) {
        setTypingError('Confirmation target is missing. Please try again.');
        return;
      }
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTypedText('');
      setTypingError('');
      onClose();
    }
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTypedText(value);
    if (typingError && value === typingTarget) {
      setTypingError('');
    }
  };

  const isConfirmDisabled = isLoading || (requireTyping && typedText !== typingTarget);

  // Reset typing state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setTypedText('');
      setTypingError('');
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className={`relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all ${styles.border} border-2 animate-slideIn`}>
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">{styles.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
            
            {requireTyping && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-mono text-red-600">"{typingTarget}"</span> to confirm:
                </label>
                <input
                  type="text"
                  value={typedText}
                  onChange={handleTypingChange}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    typingError 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter the exact name..."
                  disabled={isLoading}
                />
                {typingError && (
                  <p className="mt-1 text-sm text-red-600">{typingError}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmButton} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 