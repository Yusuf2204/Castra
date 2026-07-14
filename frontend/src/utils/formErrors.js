export const getFieldError = (errors, field) => {
  const value = errors?.[field]

  if (Array.isArray(value)) return value[0]
  if (typeof value === 'string') return value

  return null
}

export const normalizeValidationErrors = (errors = {}) =>
  Object.entries(errors).reduce((result, [field, value]) => {
    result[field] = Array.isArray(value) ? value : [value]
    return result
  }, {})
