import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link2,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Table,
  Equal,
  Image,
  Sigma,
  Trash2,
} from 'lucide-react';
import { stripHtml } from '../utils/string';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  minHeight?: number;
}

type ToolbarCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'createLink'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'insertUnorderedList';

type SpecialToolbarAction = 'link' | 'highlight' | 'table' | 'equation' | 'function' | 'image';

interface MainToolbarConfig {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  behavior: 'command' | 'link' | 'highlight' | 'image';
  command?: ToolbarCommand;
}

interface SpecialToolbarConfig {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  action: SpecialToolbarAction;
}

const toolbarButtonClass =
  'cursor-pointer rounded p-0.5 text-[#6B7280] transition-colors hover:bg-[#EEF2F7] hover:text-[#374151]';

const activeToolbarButtonClass =
  'cursor-pointer rounded bg-[#384EC7] p-0.5 text-white transition-colors hover:bg-[#2F3FA8]';

const MAIN_TOOLBAR_CONFIG: MainToolbarConfig[] = [
  { icon: Italic, label: 'Italic', behavior: 'command', command: 'italic' },
  { icon: Bold, label: 'Bold', behavior: 'command', command: 'bold' },
  { icon: Underline, label: 'Underline', behavior: 'command', command: 'underline' },
  { icon: Strikethrough, label: 'Strikethrough', behavior: 'command', command: 'strikeThrough' },
  { icon: Image, label: 'Image Upload', behavior: 'image' },
  { icon: Link2, label: 'Link', behavior: 'link', command: 'createLink' },
  { icon: Square, label: 'Highlight', behavior: 'highlight' },
  { icon: AlignLeft, label: 'Align left', behavior: 'command', command: 'justifyLeft' },
  { icon: AlignCenter, label: 'Align center', behavior: 'command', command: 'justifyCenter' },
  { icon: AlignRight, label: 'Align right', behavior: 'command', command: 'justifyRight' },
  { icon: List, label: 'Bullet list', behavior: 'command', command: 'insertUnorderedList' },
];

const SPECIAL_TOOLBAR_CONFIG: SpecialToolbarConfig[] = [
  { icon: Table, label: 'Table', action: 'table' },
  { icon: Equal, label: 'Equation', action: 'equation' },
  { icon: Image, label: 'Image', action: 'image' },
  { icon: Sigma, label: 'Function', action: 'function' },
];

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Type here',
  minHeight = 140,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStates, setActiveStates] = useState<Partial<Record<ToolbarCommand, boolean>>>({});

  const updateActiveStates = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setActiveStates({});
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      setActiveStates({});
      return;
    }

    setActiveStates({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      createLink: document.queryCommandState('createLink'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
    });
  }, []);

  const syncValue = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    onChange(html);
    updateActiveStates();
  }, [onChange, updateActiveStates]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || '';
    }
  }, [value]);

  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveStates);
    return () => document.removeEventListener('selectionchange', updateActiveStates);
  }, [updateActiveStates]);

  const runCommand = useCallback(
    (command: string, commandValue?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, commandValue);
      syncValue();
    },
    [syncValue]
  );

  const handleLink = useCallback(() => {
    const url = window.prompt('Enter link URL');
    if (url) {
      runCommand('createLink', url);
    }
  }, [runCommand]);

  const handleImageUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        runCommand('insertImage', base64);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, [runCommand]);

  const handleMainToolbarClick = useCallback(
    (item: MainToolbarConfig) => {
      if (item.behavior === 'image') {
        handleImageUploadClick();
        return;
      }
      if (item.behavior === 'highlight') {
        runCommand('hiliteColor', '#E5E7EB');
        return;
      }
      if (item.behavior === 'link') {
        handleLink();
        return;
      }
      if (item.command) {
        runCommand(item.command);
      }
    },
    [handleLink, runCommand, handleImageUploadClick]
  );

  const handleSpecialToolbarClick = useCallback(
    (action: SpecialToolbarAction) => {
      switch (action) {
        case 'link':
          handleLink();
          break;
        case 'image':
          handleImageUploadClick();
          break;
        case 'highlight':
          runCommand('hiliteColor', '#E5E7EB');
          break;
        case 'table':
          runCommand('insertHTML', '<table border="1"><tr><td>&nbsp;</td></tr></table>');
          break;
        case 'equation':
          runCommand('insertText', '=');
          break;
        case 'function':
          runCommand('insertText', 'f(x)');
          break;
      }
    },
    [handleLink, runCommand, handleImageUploadClick]
  );

  const isEmpty = !value || value === '<br>' || stripHtml(value).length === 0;

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    onChange('');
    onClear?.();
    setActiveStates({});
  };

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white transition-colors focus-within:border-[#384EC7]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#EEF2F7] bg-[#F8FAFC] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          {MAIN_TOOLBAR_CONFIG.map(({ icon: Icon, label, command, behavior }) => (
            <button
              key={label}
              type="button"
              title={label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleMainToolbarClick({ icon: Icon, label, command, behavior })}
              className={command && activeStates[command] ? activeToolbarButtonClass : toolbarButtonClass}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-[8px] bg-[#EFF6FF] px-2 py-1">
          {SPECIAL_TOOLBAR_CONFIG.map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              type="button"
              title={label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSpecialToolbarClick(action)}
              className={toolbarButtonClass}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute left-4 top-3 placeholder-text">
            {placeholder}
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncValue}
          onBlur={syncValue}
          onKeyUp={updateActiveStates}
          onMouseUp={updateActiveStates}
          onFocus={updateActiveStates}
          className="wysiwyg-editor min-w-0 px-4 py-3 pr-10 text-base font-medium leading-[150%] text-[#374151] focus:outline-none"
          style={{ minHeight }}
        />

        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-3 cursor-pointer text-[#9CA3AF] transition-colors hover:text-[#FF7F7F]"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
