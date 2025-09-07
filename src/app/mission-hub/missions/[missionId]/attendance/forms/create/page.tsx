'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CreateAttendanceFormPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = String(params?.missionId || '');
  const { user } = useAuth();
  const isPrivileged = useMemo(() => ['admin', 'sre', 'mentor', 'developer'].includes(user?.role || ''), [user]);

  // Form state
  const [title, setTitle] = useState('Daily Check-in');
  const [active, setActive] = useState(true);
  const [questions, setQuestions] = useState<Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
    description?: string;
    placeholder?: string;
    order: number;
  }>>([]);
  const [openTooltips, setOpenTooltips] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle click outside notification to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notification && notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotification(null);
      }
    };

    if (notification) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [notification]);

  if (!isPrivileged) return <div className="p-4">Insufficient permissions.</div>;

  const generateUniqueKey = (label: string, existingKeys: Set<string>): string => {
    let baseKey = label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    if (!baseKey) baseKey = 'question';
    
    let key = baseKey;
    let counter = 1;
    while (existingKeys.has(key)) {
      key = `${baseKey}_${counter}`;
      counter++;
    }
    
    return key;
  };

  const addQuestion = () => {
    const existingKeys = new Set(questions.map(q => q.key));
    const newKey = generateUniqueKey('new_question', existingKeys);
    
    const newQuestion = {
      key: newKey,
      label: 'New Question',
      type: 'text',
      required: false,
      options: [],
      description: '',
      placeholder: '',
      order: questions.length
    };
    
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[index];
    
    if (field === 'label') {
      // Generate new key when label changes
      const existingKeys = new Set(questions.map((q, i) => i !== index ? q.key : ''));
      const newKey = generateUniqueKey(value, existingKeys);
      question.key = newKey;
    }
    
    if (field === 'options') {
      question.options = value;
    } else {
      (question as any)[field] = value;
    }
    
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    // Reorder remaining questions
    updatedQuestions.forEach((q, i) => {
      q.order = i;
    });
    setQuestions(updatedQuestions);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    const updatedQuestions = [...questions];
    [updatedQuestions[index], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[index]];
    
    // Update order
    updatedQuestions.forEach((q, i) => {
      q.order = i;
    });
    
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    updatedQuestions[questionIndex].options!.push('');
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options![optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options!.splice(optionIndex, 1);
    setQuestions(updatedQuestions);
  };

  const moveOption = (questionIndex: number, optionIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? optionIndex - 1 : optionIndex + 1;
    const options = questions[questionIndex].options!;
    if (newIndex < 0 || newIndex >= options.length) return;
    
    const updatedQuestions = [...questions];
    [updatedQuestions[questionIndex].options![optionIndex], updatedQuestions[questionIndex].options![newIndex]] = 
    [updatedQuestions[questionIndex].options![newIndex], updatedQuestions[questionIndex].options![optionIndex]];
    setQuestions(updatedQuestions);
  };

  const toggleTooltip = (field: string) => {
    const newOpenTooltips = new Set(openTooltips);
    if (newOpenTooltips.has(field)) {
      newOpenTooltips.delete(field);
    } else {
      newOpenTooltips.add(field);
    }
    setOpenTooltips(newOpenTooltips);
  };

  const closeAllTooltips = () => {
    setOpenTooltips(new Set());
  };

  const createForm = async () => {
    if (questions.length === 0) {
      setNotification({ type: 'error', message: 'Please add at least one question' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v2/attendance/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          missionId,
          title,
          active,
          questions: questions.map(q => ({
            key: q.key,
            label: q.label,
            type: q.type,
            required: q.required || false,
            options: q.options || [],
            description: q.description || '',
            placeholder: q.placeholder || '',
            order: q.order
          }))
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({ type: 'success', message: 'Form created successfully!' });
        setTimeout(() => {
          router.push(`/mission-hub/missions/${missionId}/attendance/forms`);
        }, 1500);
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to create form' });
      }
    } catch (error) {
      console.error('Error creating form:', error);
      setNotification({ type: 'error', message: 'Failed to create form' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('Daily Check-in');
    setActive(true);
    setQuestions([]);
    setOpenTooltips(new Set());
  };

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'single-select', label: 'Single Select' },
    { value: 'multi-select', label: 'Multi Select' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Time' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'url', label: 'URL' },
    { value: 'phone', label: 'Phone' },
    { value: 'file', label: 'File Upload' },
    { value: 'rating', label: 'Rating' },
    { value: 'scale', label: 'Scale' }
  ];

  const tooltips = {
    fieldType: 'Choose the type of input field. Text for short answers, Paragraph for long text, Single Select for dropdown, etc.',
    questionLabel: 'The question text that will be displayed to students. This should be clear and specific.',
    description: 'Optional help text that appears below the question to guide students.',
    placeholder: 'Optional placeholder text that appears inside the input field as a hint.',
    options: 'For dropdown and multi-select questions, add the available choices. One option per line.',
    required: 'Whether students must answer this question before submitting the form.'
  };

  return (
    <div className="p-6" onClick={closeAllTooltips}>
      {/* Custom Notification */}
      {notification && (
        <div 
          ref={notificationRef}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✓' : '✕'}</span>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Attendance Form</h1>
          <p className="text-gray-600">Design a custom attendance form for this mission.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Form Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Form Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter form title"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Active (students can use this form)
              </label>
            </div>
          </div>
        </div>

        {/* Questions Builder */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Questions</h2>
            <button
              onClick={addQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No questions added yet. Click "Add Question" to start building your form.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-md font-medium text-gray-700">Question {index + 1}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === questions.length - 1}
                        className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeQuestion(index)}
                        className="px-2 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                        title="Remove question"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Field Type */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field Type
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`fieldType_${index}`);
                          }}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          ℹ️
                        </button>
                      </label>
                      {openTooltips.has(`fieldType_${index}`) && (
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
                          {tooltips.fieldType}
                        </div>
                      )}
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {fieldTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Question Label */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Label
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`questionLabel_${index}`);
                          }}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          ℹ️
                        </button>
                      </label>
                      {openTooltips.has(`questionLabel_${index}`) && (
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
                          {tooltips.questionLabel}
                        </div>
                      )}
                      <input
                        type="text"
                        value={question.label}
                        onChange={(e) => updateQuestion(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter question text"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTooltip(`description_${index}`);
                        }}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        ℹ️
                      </button>
                    </label>
                    {openTooltips.has(`description_${index}`) && (
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
                        {tooltips.description}
                      </div>
                    )}
                    <input
                      type="text"
                      value={question.description || ''}
                      onChange={(e) => updateQuestion(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Enter your full name as it appears on your ID"
                    />
                  </div>

                  {/* Placeholder - Conditional */}
                  {['text', 'paragraph', 'email', 'number', 'date', 'time', 'datetime', 'url', 'phone'].includes(question.type) && (
                    <div className="mt-4 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Placeholder (Optional)
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`placeholder_${index}`);
                          }}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          ℹ️
                        </button>
                      </label>
                      {openTooltips.has(`placeholder_${index}`) && (
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
                          {tooltips.placeholder}
                        </div>
                      )}
                      <input
                        type="text"
                        value={question.placeholder || ''}
                        onChange={(e) => updateQuestion(index, 'placeholder', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Type your answer here..."
                      />
                    </div>
                  )}

                  {/* Options - For select types */}
                  {['single-select', 'multi-select'].includes(question.type) && (
                    <div className="mt-4 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTooltip(`options_${index}`);
                          }}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          ℹ️
                        </button>
                      </label>
                      {openTooltips.has(`options_${index}`) && (
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
                          {tooltips.options}
                        </div>
                      )}
                      <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            <button
                              onClick={() => moveOption(index, optionIndex, 'up')}
                              disabled={optionIndex === 0}
                              className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveOption(index, optionIndex, 'down')}
                              disabled={optionIndex === (question.options?.length || 0) - 1}
                              className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => removeOption(index, optionIndex)}
                              className="px-2 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                              title="Remove option"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(index)}
                          className="px-3 py-2 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Required */}
                  <div className="mt-4 relative">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.required || false}
                        onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Required</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTooltip(`required_${index}`);
                        }}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        ℹ️
                      </button>
                    </label>
                    {openTooltips.has(`required_${index}`) && (
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
                        {tooltips.required}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={createForm}
              disabled={questions.length === 0 || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
