import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import Select from 'react-select'

/**
 * CustomSelect - Reusable Select2-style Autocomplete Component for Castra.
 * Wraps react-select with seamless CoreUI integration, Dark Mode compatibility,
 * automated value/ID mapping, and invalid feedback handling.
 */
const CustomSelect = ({
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih opsi...',
  isClearable = false,
  isDisabled = false,
  disabled = false,
  invalid = false,
  feedbackInvalid,
  size = 'md',
  className = '',
  menuPlacement = 'auto',
  formatOptionLabel,
  isSearchable = true,
  noOptionsMessage = () => 'Tidak ada data ditemukan',
  ...restProps
}) => {
  const isInputDisabled = Boolean(isDisabled || disabled)
  const hasError = Boolean(invalid || feedbackInvalid)

  // Map primitive value (id/string) to the corresponding option object
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'object' && value.value !== undefined) return value
    return options.find((opt) => String(opt.value) === String(value)) || null
  }, [value, options])

  const handleSelectChange = (selected) => {
    const val = selected ? selected.value : ''
    if (onChange) {
      // Simulate synthetic form event for standard handleChange(e) compatibility
      // Also provide value and selected directly on the event object for flexible handlers
      const syntheticEvent = {
        target: {
          name,
          value: val,
        },
        value: val,
        selected,
      }
      onChange(syntheticEvent, selected)
    }
  }

  const containerClasses = [
    'react-select-container',
    size === 'sm' ? 'react-select-sm' : '',
    hasError ? 'is-invalid' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="w-100">
      <Select
        name={name}
        classNamePrefix="react-select"
        className={containerClasses}
        options={options}
        value={selectedOption}
        onChange={handleSelectChange}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={isInputDisabled}
        isSearchable={isSearchable}
        menuPlacement={menuPlacement}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        formatOptionLabel={formatOptionLabel}
        noOptionsMessage={noOptionsMessage}
        {...restProps}
      />
      {hasError && feedbackInvalid && (
        <div className="invalid-feedback d-block small mt-1">{feedbackInvalid}</div>
      )}
    </div>
  )
}

CustomSelect.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.node.isRequired,
    }),
  ),
  placeholder: PropTypes.string,
  isClearable: PropTypes.bool,
  isDisabled: PropTypes.bool,
  disabled: PropTypes.bool,
  invalid: PropTypes.bool,
  feedbackInvalid: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
  menuPlacement: PropTypes.string,
  formatOptionLabel: PropTypes.func,
  isSearchable: PropTypes.bool,
  noOptionsMessage: PropTypes.func,
}

export default CustomSelect
