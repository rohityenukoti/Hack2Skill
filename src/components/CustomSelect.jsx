import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Accessible custom dropdown that replaces native <select> styling.
 *
 * @param {{ value: string, label: string, disabled?: boolean }[]} options
 */
export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  ariaLabel,
  disabled = false,
  className = '',
  variant = 'default', // 'default' | 'compact' | 'dark'
  required = false,
  name,
  style,
}) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();

  const selected = options.find((opt) => opt.value === value);
  const displayLabel = selected?.label ?? placeholder;
  const isPlaceholder = !selected;

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(-1);
      return;
    }
    const selectedIndex = options.findIndex((opt) => opt.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    // Move focus into the list so arrow keys work immediately after open
    requestAnimationFrame(() => listRef.current?.focus());
  }, [open, options, value]);

  useEffect(() => {
    if (!open || highlightedIndex < 0 || !listRef.current) return;
    const optionEl = listRef.current.children[highlightedIndex];
    optionEl?.scrollIntoView?.({ block: 'nearest' });
  }, [highlightedIndex, open]);

  const commitValue = (nextValue) => {
    if (disabled) return;
    onChange?.(nextValue);
    setOpen(false);
  };

  const handleTriggerKeyDown = (event) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        event.preventDefault();
        setOpen(true);
        break;
      case 'Escape':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const handleListKeyDown = (event) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setHighlightedIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = options[highlightedIndex];
        if (option && !option.disabled) commitValue(option.value);
        break;
      }
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const rootClass = [
    'custom-select',
    `custom-select--${variant}`,
    open ? 'is-open' : '',
    disabled ? 'is-disabled' : '',
    isPlaceholder ? 'is-placeholder' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} ref={rootRef} style={style}>
      {required && (
        <input
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value || ''}
          onChange={() => {}}
          className="custom-select-native-mirror"
          name={name}
        />
      )}

      <button
        type="button"
        className="custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="custom-select-value">{displayLabel}</span>
        <ChevronDown size={variant === 'compact' ? 12 : 16} className="custom-select-chevron" aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={listboxId}
          ref={listRef}
          className="custom-select-menu"
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={option.value === '' ? `__placeholder-${index}` : option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                className={[
                  'custom-select-option',
                  isSelected ? 'is-selected' : '',
                  isHighlighted ? 'is-highlighted' : '',
                  option.disabled ? 'is-disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => {
                  if (!option.disabled) commitValue(option.value);
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} className="custom-select-check" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
